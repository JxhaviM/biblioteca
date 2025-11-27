const XLSX = require('xlsx');
const Book = require('../models/book');
const Log = require('../models/Log');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Mapear estados del Excel a nuestro modelo
const mapearEstado = (estado) => {
    if (!estado) return 'Bueno';
    
    const estadoLower = estado.toString().toLowerCase().trim();
    
    if (estadoLower.includes('buen') || estadoLower.includes('excelen') || estadoLower.includes('nuevo')) {
        return 'Bueno';
    }
    if (estadoLower.includes('regular') || estadoLower.includes('usado')) {
        return 'Regular';
    }
    if (estadoLower.includes('mal') || estadoLower.includes('deteriorad') || estadoLower.includes('dañ')) {
        return 'Malo';
    }
    
    return 'Bueno'; // Por defecto
};

// Limpiar y formatear texto
const limpiarTexto = (texto) => {
    if (!texto) return '';
    return texto.toString().trim().replace(/\s+/g, ' ');
};

// Procesar áreas separadas por comas o punto y coma en array
const procesarAreas = (areasTexto) => {
    if (!areasTexto) return [];
    
    return areasTexto
        .toString()
        .split(/[;,]/)
        .map(area => limpiarTexto(area))
        .filter(area => area.length > 0)
        .slice(0, 5); // Máximo 5 géneros según el modelo
};

// Procesar ubicación (puede tener múltiples separadas por comas o punto y coma)
const procesarUbicacion = (ubicacionTexto) => {
    if (!ubicacionTexto) return 'Estante General';
    
    const ubicaciones = ubicacionTexto
        .toString()
        .split(/[;,]/)
        .map(ub => limpiarTexto(ub))
        .filter(ub => ub.length > 0);
    
    return ubicaciones.join(', ') || 'Estante General';
};

// Normalizar claves de encabezado: quitar acentos, NBSP, minúsculas, colapsar espacios
const normalizarClave = (k) => {
    if (!k) return '';
    const sinAcentos = k
        .toString()
        .replace(/\u00A0/g, ' ') // NBSP a espacio normal
        .normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return sinAcentos
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ') // quitar puntuación rara
        .replace(/\s+/g, ' ')
        .trim();
};

// Mapa de claves canónicas que soportamos
const CLAVES = {
    cantidad: ['cantidad', 'copias', 'numero de copias', 'n copias'],
    titulo: ['titulo', 'titulo del libro', 'nombre del libro', 'titulo  '],
    autor: ['autor', 'autores'],
    editorial: ['editorial', 'casa editorial'],
    anio: ['ano de publicacion', 'año de publicacion', 'ano', 'anio', 'año'],
    isbn: ['isbn', 'is@bn', 'codigo isbn'],
    estado: ['estado de conservacion', 'estado', 'conservacion'],
    formato: ['formato', 'tipo de formato'],
    area: ['area', 'areas', 'genero', 'generos'],
    grado: ['grado'],
    ubicacion: ['ubicacion', 'ubicación', 'estante', 'locacion', 'localizacion']
};

const extraerCampo = (fila, clavesPosibles, porDefecto = '') => {
    // Construir un mapa normalizado key->value para la fila
    const norm = {};
    Object.keys(fila).forEach((kk) => {
        norm[normalizarClave(kk)] = fila[kk];
    });
    for (const alias of clavesPosibles) {
        const n = normalizarClave(alias);
        if (norm[n] !== undefined && norm[n] !== null && String(norm[n]).trim() !== '') {
            return norm[n];
        }
    }
    return porDefecto;
};

// Generar ISBN único válido (solo dígitos, X y guiones; 10-17 chars)
const generarISBNUnico = (isbnBase, copiaN) => {
    // Generar un ID completamente aleatorio y único usando crypto
    const randomHex = crypto.randomBytes(4).toString('hex'); // 8 caracteres hex
    const timestampSuffix = Date.now().toString().slice(-5); // Últimos 5 dígitos del timestamp
    const uniqueId = timestampSuffix + randomHex.substring(0, 4); // 9 caracteres únicos
    
    const cleanDigits = (s) => s.toString().replace(/[^0-9Xx]/g, '').toUpperCase();
    const limitLen = (s, min = 10, max = 17) => {
        if (s.length < min) {
            return (s + '0000000000000000').slice(0, min);
        }
        if (s.length > max) {
            return s.slice(0, max);
        }
        return s;
    };

    if (!isbnBase || isbnBase === 'N/A' || isbnBase === '') {
        // Sin ISBN base: generar completamente único con prefijo 978
        return '978' + uniqueId;
    }

    // Limpiar a dígitos/X
    let base = cleanDigits(isbnBase);
    if (base.length > 7) {
        base = base.slice(0, 7); // Reducir base para dejar espacio al uniqueId
    }
    
    // Formato: BASE-UNIQUEID
    // uniqueId tiene 9 chars, con guion son 10, más base de hasta 7 = máximo 17
    const candidate = base + '-' + uniqueId;
    return limitLen(candidate, 10, 17);
};

// Normalizar clave (remueve tildes, espacios, signos y pasa a minúsculas)
const normalizeKey = (key) => {
    if (!key) return '';
    return key
        .toString()
        .trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
        .replace(/[^a-zA-Z0-9]/g, '') // quitar todo menos alfanumérico (maneja ; : @ etc.)
        .toLowerCase();
};

// Construir mapa normalizado de una fila { claveNormalizada: valor }
const buildNormalizedRow = (rowObj) => {
    const map = {};
    Object.keys(rowObj || {}).forEach((k) => {
        const nk = normalizeKey(k);
        map[nk] = rowObj[k];
    });
    return map;
};

// Obtener valor por lista de posibles claves canónicas ya normalizadas
const getByCandidates = (nRow, candidates) => {
    for (const c of candidates) {
        if (nRow[c] !== undefined && nRow[c] !== null && String(nRow[c]).trim() !== '') {
            return nRow[c];
        }
    }
    return '';
};

// Carga masiva de libros desde Excel
exports.bulkUploadBooks = async (req, res) => {
    try {
        const userId = req.user?.id || null;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ningún archivo'
            });
        }

        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        
        // Leer el archivo Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON manteniendo celdas vacías como ''
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        console.log(`📚 Procesando ${data.length} filas del Excel...`);
        
        // Silenciar debug en producción
        if (process.env.NODE_ENV !== 'production' && data.length > 0) {
            const primeraFila = data[0];
            console.log('🔍 ENCABEZADOS ORIGINALES DEL EXCEL:');
            console.log(Object.keys(primeraFila));
            console.log('🔍 ENCABEZADOS NORMALIZADOS:');
            const nRowDebug = buildNormalizedRow(primeraFila);
            console.log(Object.keys(nRowDebug));
        }
        
        const librosCreados = [];
        const errores = [];
        let totalLibros = 0;
        
        for (let i = 0; i < data.length; i++) {
            const fila = data[i];
            const nRow = buildNormalizedRow(fila);
            
            try {
                // DEBUG: Mostrar fila original y normalizada
                if (i < 3) { // Solo las primeras 3 filas para no saturar logs
                    console.log(`\n📖 DEBUG FILA ${i + 2}:`);
                    console.log('Original:', JSON.stringify(fila, null, 2));
                    console.log('Normalizada:', JSON.stringify(nRow, null, 2));
                }
                // Candidatos normalizados por campo (más variaciones)
                const candCantidad = ['cantidad', 'cant', 'qty', 'copias', 'cantidad', 'Cantidad'];
                const candTitulo = ['titulo', 'tit', 'title', 'nombre', 'name', 'libro', 'Título'];
                const candAutor = ['autor', 'autores', 'author', 'escritor'];
                const candEditorial = ['editorial', 'editor', 'publisher'];
                const candAnio = ['anodepublicacion', 'aniopublicacion', 'anopublicacion', 'ano', 'anio', 'year', 'fecha', 'publicacion'];
                const candISBN = ['isbn', 'isbn10', 'isbn13', 'codigo', 'code'];
                const candEstado = ['estadodeconservacion', 'estadoconservacion', 'estado', 'condition'];
                const candFormato = ['formato', 'format', 'tipo'];
                const candArea = ['area', 'areas', 'categoria', 'categorias', 'genre', 'genero'];
                const candGrado = ['grado', 'grade', 'nivel', 'Grado'];
                const candUbicacion = ['ubicacion', 'location', 'estante', 'shelf'];

                const cantidadRaw = getByCandidates(nRow, candCantidad);
                const tituloRaw = getByCandidates(nRow, candTitulo);
                const autorRaw = getByCandidates(nRow, candAutor);
                const editorialRaw = getByCandidates(nRow, candEditorial);
                const anioRaw = getByCandidates(nRow, candAnio);
                const isbnBaseRaw = getByCandidates(nRow, candISBN);
                const estadoRaw = getByCandidates(nRow, candEstado);
                const formatoRaw = getByCandidates(nRow, candFormato);
                const areaRaw = getByCandidates(nRow, candArea);
                const gradoRaw = getByCandidates(nRow, candGrado);
                const ubicacionRaw = getByCandidates(nRow, candUbicacion);

                // Limpiar valores
                const cantidad = parseInt(String(cantidadRaw || '1').toString().trim()) || 1;
                const titulo = limpiarTexto(tituloRaw);
                const autor = limpiarTexto(autorRaw);
                const editorial = limpiarTexto(editorialRaw);
                const anio = parseInt(String(anioRaw || '').toString().trim()) || new Date().getFullYear();
                const isbnBase = String(isbnBaseRaw || '').toString().trim();
                const estadoConservacion = String(estadoRaw || 'Bueno');
                const formato = limpiarTexto(formatoRaw || '');
                const area = areaRaw;
                const grado = limpiarTexto(gradoRaw || '');
                const ubicacion = ubicacionRaw;
                
                // DEBUG: Mostrar valores extraídos (solo primeras 3 filas)
                if (i < 3) {
                    console.log(`✅ VALORES EXTRAÍDOS FILA ${i + 2}:`);
                    console.log('  Cantidad RAW:', cantidadRaw, '→ Procesada:', cantidad);
                    console.log('  Título RAW:', tituloRaw, '→ Limpio:', titulo);
                    console.log('  Autor RAW:', autorRaw, '→ Limpio:', autor);
                    console.log('  ISBN:', isbnBase);
                    console.log('  Grado:', grado);
                }
                
                // Validaciones básicas
                if (!titulo || titulo.length < 1) {
                    errores.push({
                        fila: i + 2,
                        error: 'Título inválido o vacío',
                        datos: fila
                    });
                    continue;
                }
                
                if (!autor || autor.length < 1) {
                    errores.push({
                        fila: i + 2,
                        error: 'Autor inválido o vacío',
                        datos: fila
                    });
                    continue;
                }
                
                // Crear libros individuales según la cantidad
                const cantidadValida = isNaN(cantidad) ? 1 : Math.min(cantidad, 100); // Máximo 100 por fila
                
                if (i < 3) {
                    console.log(`🔄 CREANDO ${cantidadValida} COPIAS para "${titulo}" (ISBN: ${isbnBase})`);
                }
                
                for (let copyNum = 1; copyNum <= cantidadValida; copyNum++) {
                    // TODAS las copias comparten el MISMO ISBN - son copias físicas del mismo libro
                    const isbnFinal = isbnBase && isbnBase !== 'N/A' && isbnBase !== '' 
                        ? isbnBase.toString().trim()
                        : `SIN-ISBN-${Date.now()}-${copyNum}`;
                    
                    const libroData = {
                        title: titulo,
                        author: autor,
                        isbn: isbnFinal,
                        publisher: editorial || 'Editorial Desconocida',
                        publishedYear: anio,
                        estadoLibro: mapearEstado(estadoConservacion),
                        genre: procesarAreas(area),
                        grado: grado,
                        location: procesarUbicacion(ubicacion),
                        description: formato ? `Formato: ${formato}` : '',
                        language: 'es',
                        isActive: true
                    };
                    
                    const libro = await Book.create(libroData);
                    
                    librosCreados.push({
                        titulo: libro.title,
                        isbn: libro.isbn,
                        copia: copyNum,
                        totalCopies: cantidadValida
                    });
                }
                
                totalLibros += cantidadValida;
                
            } catch (error) {
                console.error(`Error procesando fila ${i + 2}:`, error);
                errores.push({
                    fila: i + 2,
                    error: error.message,
                    datos: fila
                });
            }
        }
        
        // Eliminar archivo temporal
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error('Error al eliminar archivo temporal:', err);
        }
        
        // Registrar en logs
        await Log.crear({
            tipo: 'INFO',
            categoria: 'SYSTEM',
            accion: 'BULK_UPLOAD_BOOKS',
            descripcion: `Carga masiva de ${totalLibros} libros completada`,
            ...(userId ? { usuario: userId } : {}),
            ip: req.ip,
            datos: {
                totalLibros,
                filasExcel: data.length,
                errores: errores.length
            }
        });
        
        res.json({
            success: true,
            message: `Carga masiva completada: ${totalLibros} libros creados`,
            stats: {
                totalLibros,
                filasProcessadas: data.length,
                exitos: librosCreados.length,
                errores: errores.length
            },
            librosCreados: librosCreados.slice(0, 10), // Primeros 10 para preview
            errores: errores.slice(0, 10) // Primeros 10 errores
        });
        
    } catch (error) {
        console.error('Error en carga masiva de libros:', error);
        
        // Intentar eliminar archivo si existe
        if (req.file) {
            try {
                const filePath = path.join(__dirname, '../uploads', req.file.filename);
                fs.unlinkSync(filePath);
            } catch (err) {
                // Ignorar error
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al procesar la carga masiva',
            error: error.message
        });
    }
};

// Obtener estadísticas de libros
exports.getBooksStats = async (req, res) => {
    try {
        const [
            totalLibros,
            librosPorGrado,
            librosPorEstado,
            librosPorGenero
        ] = await Promise.all([
            Book.countDocuments({ isActive: true }),
            Book.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$grado', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Book.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$estadoLibro', count: { $sum: 1 } } }
            ]),
            Book.aggregate([
                { $match: { isActive: true } },
                { $unwind: '$genre' },
                { $group: { _id: '$genre', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
        ]);
        
        res.json({
            success: true,
            stats: {
                total: totalLibros,
                porGrado: librosPorGrado,
                porEstado: librosPorEstado,
                porGenero: librosPorGenero
            }
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};
