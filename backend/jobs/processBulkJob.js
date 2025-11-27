const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Person = require('../models/person');
const BulkJob = require('../models/bulkJob');

// Intentaremos usar iconv-lite si está instalado para manejar archivos en latin1/Windows-1252
let iconv;
try {
  iconv = require('iconv-lite');
} catch (e) {
  iconv = null; // fallback si no está instalado
}

let xlsx;
try {
  xlsx = require('xlsx');
} catch (e) {
  xlsx = null;
}

// Helper: normalizar texto (trim, uppercase, remover diacríticos)
const normalizeText = (s) => {
  if (!s && s !== 0) return '';
  try {
    const str = String(s).trim();
    // remover diacríticos
    return str.normalize ? str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase() : str.toUpperCase();
  } catch (e) {
    return String(s).toUpperCase();
  }
};

// Mapeo tolerante para tipos de documento
const mapTipoDoc = (input) => {
  const v = normalizeText(input).replace(/[:.]/g, '');
  if (!v) return undefined;
  // checks for common codes or full descriptions
  if (v === 'PPT' || v.includes('PERMISO') || v.includes('PROTECCION') || v.includes('PROTECCION TEMPORAL') || v.includes('PROTECCIONTEMPORAL')) return 'PPT';
  if (v === 'TI' || v.includes('TARJETA') || v.includes('TARJETA DE IDENTIDAD')) return 'TI';
  if (v === 'NES' || v.includes('NUMERO') || v.includes('ESTABLECIDO') || v.includes('SECRETARIA')) return 'NES';
  if (v === 'RC' || v.includes('REGISTRO CIVIL') || v.includes('REGISTRO')) return 'RC';
  if (v === 'CC' || v.includes('CEDULA') || v.includes('CIUDADANIA') || v.includes('CIUDADANÍA')) return 'CC';
  // fallback: if it's 2-4 letters, return as-is uppercase
  if (/^[A-Z]{1,4}$/.test(v)) return v;
  return undefined;
};

// Normalizar genero
const mapGenero = (g) => {
  const v = normalizeText(g);
  if (!v) return undefined;
  if (['M', 'MA', 'MASC', 'MASCULINO', 'H'].includes(v)) return 'Masculino';
  if (['F', 'FE', 'FEM', 'FEMENINO'].includes(v)) return 'Femenino';
  return undefined;
};

module.exports = async function(job, done) {
  const { data } = job.attrs;
  const { filename, originalName, tipoPersona, userId } = data;
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  // Update job to processing
  const bulk = await BulkJob.findById(job.attrs.data.bulkJobId);
  if (bulk) {
    bulk.status = 'processing';
    await bulk.save();
  }

  if (!fs.existsSync(filePath)) {
    if (bulk) { bulk.status = 'failed'; await bulk.save(); }
    return done(new Error('File not found'));
  }

  const ext = path.extname(filePath).toLowerCase();

  // If Excel file, read with xlsx and convert to stream of rows
  if ((ext === '.xls' || ext === '.xlsx') && xlsx) {
    try {
      const workbook = xlsx.readFile(filePath, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(sheet, { defval: '' });

      // create a readable stream from JSON rows
      const { Readable } = require('stream');
      const rows = json.map(r => {
        // ensure keys are header-like strings
        const normalized = {};
        Object.keys(r).forEach(k => { normalized[k.toString().trim()] = r[k]; });
        return normalized;
      });

      const readStream = Readable.from(rows);

      // We'll pipe this custom stream into a small adapter that emits 'data' events with row objects
      const results = [];
      const errors = [];
      let total = 0;
      let processed = 0;
      let inserted = 0;

      for await (const rawRow of readStream) {
        total++;
        const row = rawRow; // already object

        // Normalize keys similar to CSV path
        const normalizeKeysRow = {};
        Object.keys(row).forEach(k => {
          const nk = k ? k.trim().toLowerCase() : k;
          normalizeKeysRow[nk] = row[k];
        });

        const personData = {
          grado: normalizeKeysRow['grado_cod'] || normalizeKeysRow['grado'] || undefined,
          grupo: normalizeKeysRow['grupo'] || undefined,
          doc: (normalizeKeysRow['doc'] || normalizeKeysRow['documento'] || '').toString().trim(),
          tipoDoc: mapTipoDoc(normalizeKeysRow['tipodoc'] || normalizeKeysRow['tipo_doc'] || normalizeKeysRow['tipodocumento']),
          apellido1: (normalizeKeysRow['apellido1'] || '').toString().trim(),
          apellido2: (normalizeKeysRow['apellido2'] || '').toString().trim(),
          nombre1: (normalizeKeysRow['nombre1'] || '').toString().trim(),
          nombre2: (normalizeKeysRow['nombre2'] || '').toString().trim(),
          genero: mapGenero(normalizeKeysRow['genero'] || normalizeKeysRow['sexo']) || undefined,
          tipoPersona: tipoPersona
        };

        const rowErrors = [];
        if (!personData.doc) rowErrors.push('DOC faltante');
        if (!personData.apellido1) rowErrors.push('APELLIDO1 faltante');
        if (!personData.nombre1) rowErrors.push('NOMBRE1 faltante');
        if (!personData.tipoDoc) rowErrors.push(`TIPODOC inválido o desconocido: ${normalizeKeysRow['tipodoc'] || ''}`);

        if (rowErrors.length > 0) {
          errors.push({ row: total, errors: rowErrors, data: personData });
          processed++;
          if (bulk) { bulk.processed = processed; bulk.errors = errors.length; bulk.updatedAt = new Date(); bulk.save(); }
          continue;
        }

        results.push(personData);
        // insert in batches
        if (results.length >= 200) {
          const batch = results.splice(0, results.length);
          try {
            const docs = await Person.insertMany(batch, { ordered: false });
            inserted += docs.length;
            processed += batch.length;
            if (bulk) { bulk.processed = processed; bulk.inserted = inserted; bulk.updatedAt = new Date(); await bulk.save(); }
          } catch (e) {
            const writeErrors = (e && e.writeErrors) ? e.writeErrors.map(w => ({ index: w.index, errmsg: w.errmsg })) : [{ message: e.message }];
            errors.push(...writeErrors);
            processed += batch.length;
            if (bulk) { bulk.processed = processed; bulk.errors = errors.length; bulk.updatedAt = new Date(); await bulk.save(); }
          }
        }
      }

      // insert remaining
      if (results.length > 0) {
        try {
          const docs = await Person.insertMany(results, { ordered: false });
          inserted += docs.length;
        } catch (e) {
          const writeErrors = (e && e.writeErrors) ? e.writeErrors.map(w => ({ index: w.index, errmsg: w.errmsg })) : [{ message: e.message }];
          errors.push(...writeErrors);
        }
      }

      if (bulk) {
        bulk.status = errors.length > 0 ? 'finished_with_errors' : 'completed';
        bulk.totalRows = total;
        bulk.processed = processed + results.length;
        bulk.inserted = inserted;
        bulk.errors = errors.length;
        if (errors.length > 0) {
          const errFile = `${bulk._id}_errors.json`;
          const errPath = path.join(__dirname, '..', 'uploads', errFile);
          fs.writeFileSync(errPath, JSON.stringify(errors, null, 2));
          bulk.errorFile = errFile;
        }
        bulk.updatedAt = new Date();
        await bulk.save();
      }

      return done();
    } catch (e) {
      if (bulk) { bulk.status = 'failed'; bulk.updatedAt = new Date(); await bulk.save(); }
      return done(e);
    }
  }

  // read initial bytes to try detect encoding issues (simple heuristic)
  let readStream;
  try {
    if (iconv) {
      // we will stream raw buffer and decode to utf8 using iconv if needed
      const raw = fs.readFileSync(filePath);
      // try decode as utf8 first
      let text = raw.toString('utf8');
      // heuristic: if contains replacement chars or sequences like 'Ã' common in mojibake, try latin1
      if (text.includes('\uFFFD') || /Ã[\w\W]/.test(text)) {
        try {
          text = iconv.decode(raw, 'latin1');
        } catch (e) {
          // leave text as utf8
        }
      }
      // create a readable stream from the decoded text
      const { Readable } = require('stream');
      readStream = Readable.from([text]);
    } else {
      // no iconv: fallback to reading as utf8 stream
      readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    }
  } catch (e) {
    readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  }

  const results = [];
  const errors = [];
  let total = 0;
  let processed = 0;
  let inserted = 0;

  // Use semicolon as separator per the incoming spec
  const parser = csv({ separator: ';', mapHeaders: ({ header }) => header && header.trim() });

  const stream = readStream.pipe(parser);

  stream.on('data', (row) => {
    stream.pause();
    total++;

    // Normalize incoming keys to expected lowercase without spaces
    const normalizeKeysRow = {};
    Object.keys(row).forEach(k => {
      const nk = k ? k.trim().toLowerCase() : k;
      normalizeKeysRow[nk] = row[k];
    });

    // Map CSV columns per expected layout: grado_cod;grupo;doc;tipodoc;apellido1;apellido2;nombre1;nombre2;genero
    const personData = {
      grado: normalizeKeysRow['grado_cod'] || normalizeKeysRow['grado'] || undefined,
      grupo: normalizeKeysRow['grupo'] || undefined,
      doc: (normalizeKeysRow['doc'] || normalizeKeysRow['documento'] || '').toString().trim(),
      tipoDoc: mapTipoDoc(normalizeKeysRow['tipodoc'] || normalizeKeysRow['tipo_doc'] || normalizeKeysRow['tipoDocumento'] || normalizeKeysRow['tipodocumento']),
      apellido1: (normalizeKeysRow['apellido1'] || '').toString().trim(),
      apellido2: (normalizeKeysRow['apellido2'] || '').toString().trim(),
      nombre1: (normalizeKeysRow['nombre1'] || '').toString().trim(),
      nombre2: (normalizeKeysRow['nombre2'] || '').toString().trim(),
      genero: mapGenero(normalizeKeysRow['genero'] || normalizeKeysRow['sexo']) || undefined,
      tipoPersona: tipoPersona
    };

    // Validaciones
    const rowErrors = [];
    if (!personData.doc) rowErrors.push('DOC faltante');
    if (!personData.apellido1) rowErrors.push('APELLIDO1 faltante');
    if (!personData.nombre1) rowErrors.push('NOMBRE1 faltante');
    if (!personData.tipoDoc) rowErrors.push(`TIPODOC inválido o desconocido: ${normalizeKeysRow['tipodoc'] || ''}`);

    if (rowErrors.length > 0) {
      errors.push({ row: total, errors: rowErrors, data: personData });
      processed++;
      if (bulk) { bulk.processed = processed; bulk.errors = errors.length; bulk.updatedAt = new Date(); bulk.save(); }
      stream.resume();
      return;
    }

    // Push to results for batch insert
    results.push(personData);

    // If batch size reached, insert
    if (results.length >= 200) {
      const batch = results.splice(0, results.length);
      Person.insertMany(batch, { ordered: false }).then((docs) => {
        inserted += docs.length;
        processed += batch.length;
        if (bulk) { bulk.processed = processed; bulk.inserted = inserted; bulk.updatedAt = new Date(); bulk.save(); }
        stream.resume();
      }).catch((e) => {
        const writeErrors = (e && e.writeErrors) ? e.writeErrors.map(w => ({ index: w.index, errmsg: w.errmsg })) : [{ message: e.message }];
        errors.push(...writeErrors);
        processed += batch.length;
        if (bulk) { bulk.processed = processed; bulk.errors = errors.length; bulk.updatedAt = new Date(); bulk.save(); }
        stream.resume();
      });
    } else {
      stream.resume();
    }
  });

  stream.on('end', async () => {
    // insert remaining
    if (results.length > 0) {
      try {
        const docs = await Person.insertMany(results, { ordered: false });
        inserted += docs.length;
      } catch (e) {
        const writeErrors = (e && e.writeErrors) ? e.writeErrors.map(w => ({ index: w.index, errmsg: w.errmsg })) : [{ message: e.message }];
        errors.push(...writeErrors);
      }
    }

    // Update bulk job
    if (bulk) {
      bulk.status = errors.length > 0 ? 'finished_with_errors' : 'completed';
      bulk.totalRows = total;
      bulk.processed = processed + results.length;
      bulk.inserted = inserted;
      bulk.errors = errors.length;
      if (errors.length > 0) {
        // write errors to file
        const errFile = `${bulk._id}_errors.json`;
        const errPath = path.join(__dirname, '..', 'uploads', errFile);
        fs.writeFileSync(errPath, JSON.stringify(errors, null, 2));
        bulk.errorFile = errFile;
      }
      bulk.updatedAt = new Date();
      await bulk.save();
    }

    return done();
  });

  stream.on('error', async (err) => {
    if (bulk) { bulk.status = 'failed'; bulk.updatedAt = new Date(); await bulk.save(); }
    return done(err);
  });
};
