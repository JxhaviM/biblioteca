const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Asegurar que la carpeta covers existe
const coversDir = path.join(__dirname, '..', 'uploads', 'covers');
if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
}

/**
 * Genera un nombre único para la imagen basado en el título e ISBN
 * @param {string} title - Título del libro
 * @param {string} isbn - ISBN del libro
 * @returns {string} - Nombre del archivo
 */
const generateImageName = (title, isbn) => {
    // Limpiar el título: solo letras, números y guiones
    const cleanTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Quitar caracteres especiales
        .replace(/\s+/g, '-')        // Espacios a guiones
        .substring(0, 30);           // Máximo 30 caracteres

    // Limpiar ISBN: solo números y letras
    const cleanISBN = isbn.replace(/[^a-z0-9]/gi, '').substring(0, 10);

    // Timestamp para evitar duplicados
    const timestamp = Date.now();

    return `${cleanTitle}-${cleanISBN}-${timestamp}.jpg`;
};

/**
 * Middleware para procesar y redimensionar imágenes de portadas
 */
const processBookCover = async (req, res, next) => {
    try {
        console.log('🎨 === PROCESAMIENTO DE IMAGEN ===');
        console.log('📁 Archivo presente:', req.file ? 'Sí' : 'No');
        console.log('📋 req.body antes del proceso:', JSON.stringify(req.body, null, 2));
        
        if (!req.file) {
            console.log('⏭️ Sin archivo, continuando...');
            return next();
        }

        // Obtener datos del libro del body
        const { title = 'libro', isbn = 'unknown' } = req.body;
        console.log('📚 Datos del libro:', { title, isbn });

        // Generar nombre único para la imagen
        const fileName = generateImageName(title, isbn);
        const outputPath = path.join(coversDir, fileName);
        
        console.log('💾 Guardando imagen en:', outputPath);

        // Procesar la imagen con Sharp
        await sharp(req.file.buffer)
            .resize(192, 270, {  // Cambio a portrait: 192×270px (3:4 ratio)
                fit: 'contain',         // Escalar para que quepa completa, sin recortar
                background: { r: 255, g: 255, b: 255, alpha: 1 } // Fondo blanco
            })
            .jpeg({
                quality: 85,            // Calidad 85%
                progressive: true       // JPEG progresivo
            })
            .toFile(outputPath);

        // Generar la URL pública de la imagen
        const imageUrl = `/uploads/covers/${fileName}`;

        // Agregar la URL al req.body para que el controlador la use
        req.body.coverImage = imageUrl;
        
        console.log('✅ Imagen procesada exitosamente:', imageUrl);
        console.log('📋 req.body después del proceso:', JSON.stringify(req.body, null, 2));

        // Limpiar el archivo temporal de multer (solo si existe)
        if (req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        next();

    } catch (error) {
        console.error('❌ Error procesando imagen:', error);
        console.error('📍 Stack trace:', error.stack);
        // No fallar si hay error con la imagen, simplemente continuar sin portada
        req.body.coverImage = req.body.coverImage || '';
        next();
    }
};

module.exports = {
    processBookCover,
    generateImageName
};