const Book = require('../models/book');
const mongoose = require('mongoose');

// Endpoint para obtener TODOS los libros activos sin agregación (para géneros)
const getAllBooksForGenres = async (req, res) => {
    try {
        console.log('🎭 Obtener todos los libros para géneros...');
        const { isActive = true } = req.query;
        
        // Filtro simple
        let filter = { isActive: isActive === 'true' };
        
        // Obtener TODOS los libros activos sin límite
        const books = await Book.find(filter)
            .select('genre title author isbn') // Solo campos necesarios
            .lean(); // Más rápido
        
        console.log(`✅ Encontrados ${books.length} libros para géneros`);
        
        // Extraer géneros únicos
        const allGenres = new Set();
        books.forEach(book => {
            if (book.genre && Array.isArray(book.genre)) {
                book.genre.forEach(g => {
                    if (g && g.trim()) {
                        allGenres.add(g.trim());
                    }
                });
            }
        });
        
        console.log('🎭 Géneros únicos encontrados:', Array.from(allGenres));
        
        res.json({
            success: true,
            data: books,
            genres: Array.from(allGenres).sort(),
            total: books.length
        });
        
    } catch (error) {
        console.error('❌ Error en getAllBooksForGenres:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo libros para géneros',
            error: error.message
        });
    }
};

// Endpoint simple para obtener libros sin agregación
const getSimpleBooks = async (req, res) => {
    try {
        console.log('📚 Obtener libros simples...');
        const { page = 1, limit = 50, search, genre, isActive = true } = req.query;
        
        // Primero, contar todos los documentos en la colección books
        const totalBooks = await Book.countDocuments();
        console.log(`📊 Total de documentos en colección books: ${totalBooks}`);
        
        // Mostrar algunos libros para debug
        const sampleBooks = await Book.find().limit(3);
        console.log('📖 Ejemplos de libros:', sampleBooks.map(b => ({
            title: b.title,
            author: b.author,
            genre: b.genre,
            isActive: b.isActive
        })));
        
        // Construir filtros base simples
        let filter = {};
        
        // Manejar isActive correctamente
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { isbn: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (genre) {
            filter.genre = { $in: [genre] };
        }
        
        console.log('🔍 Filtro simple:', filter);
        
        // Búsqueda simple sin agregación
        const books = await Book.find(filter)
            .sort({ title: 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        const total = await Book.countDocuments(filter);
        
        console.log(`✅ Encontrados ${books.length} libros (total: ${total})`);
        
        res.json({
            success: true,
            data: books,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('❌ Error en getSimpleBooks:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo libros',
            error: error.message
        });
    }
};

// Endpoint temporal para debug - buscar en todas las colecciones
const debugSearchBooks = async (req, res) => {
    try {
        console.log('🔍 DEBUG: Buscando libros en toda la base de datos...');
        
        // Obtener todas las colecciones
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📊 Colecciones encontradas:', collections.map(c => c.name));
        
        const searchTerm = req.query.search || 'cuentos';
        const results = {};
        
        // Buscar en cada colección
        for (const collection of collections) {
            try {
                const CollectionModel = mongoose.connection.db.collection(collection.name);
                
                // Buscar el término en campos comunes
                const searchResults = await CollectionModel.find({
                    $or: [
                        { title: { $regex: searchTerm, $options: 'i' } },
                        { author: { $regex: searchTerm, $options: 'i' } },
                        { genre: { $regex: searchTerm, $options: 'i' } },
                        { description: { $regex: searchTerm, $options: 'i' } }
                    ]
                }).limit(5).toArray();
                
                if (searchResults.length > 0) {
                    results[collection.name] = searchResults;
                    console.log(`✅ Encontrados ${searchResults.length} en colección ${collection.name}`);
                }
            } catch (err) {
                console.log(`❌ Error buscando en ${collection.name}:`, err.message);
            }
        }
        
        // También buscar específicamente por ISBN
        const isbnSearch = '978-607400639-1';
        console.log('🔍 Buscando por ISBN:', isbnSearch);
        
        for (const collection of collections) {
            try {
                const CollectionModel = mongoose.connection.db.collection(collection.name);
                const isbnResults = await CollectionModel.find({
                    $or: [
                        { isbn: isbnSearch },
                        { ISBN: isbnSearch }
                    ]
                }).limit(3).toArray();
                
                if (isbnResults.length > 0) {
                    results[collection.name + '_ISBN'] = isbnResults;
                    console.log(`✅ ISBN encontrado en ${collection.name}:`, isbnResults.length);
                }
            } catch (err) {
                console.log(`❌ Error buscando ISBN en ${collection.name}:`, err.message);
            }
        }
        
        res.json({
            success: true,
            message: 'Búsqueda completada en todas las colecciones',
            searchTerm,
            collections: collections.map(c => c.name),
            results,
            totalResults: Object.keys(results).length
        });
        
    } catch (error) {
        console.error('❌ Error en debugSearchBooks:', error);
        res.status(500).json({
            success: false,
            message: 'Error en búsqueda de debug',
            error: error.message
        });
    }
};

module.exports = { getAllBooksForGenres, getSimpleBooks, debugSearchBooks };
