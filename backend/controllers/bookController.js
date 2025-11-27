const Book = require('../models/book');
const Loan = require('../models/loan');
const Log = require('../models/Log');

// Obtener todos los libros con información de disponibilidad
const getBooks = async (req, res) => {
    try {
        const { page = 1, limit = 50, search, genre, isActive = true } = req.query;
        
        console.log('🔍 Búsqueda recibida:', { search, genre, isActive });
        
        // Construir filtros base
        let matchFilters = { isActive: isActive === 'true' };
        
        if (search) {
            matchFilters.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { isbn: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (genre) {
            // Manejar diferentes formatos del género: "cuentos", cuentos, "cuentos"
            const genrePatterns = [
                genre,                    // Exacto
                genre.toUpperCase(),      // Mayúsculas
                genre.toLowerCase(),      // Minúsculas  
                `"${genre}"`,             // Con comillas
                `'${genre}'`              // Con comillas simples
            ];
            
            matchFilters.genre = { $in: genrePatterns };
            console.log('🎭 Buscando género con patrones:', genrePatterns);
        }
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        // AGRUPAR libros por ISBN + GRADO para mostrar solo UNA FILA por cada libro único
        const aggregation = [
            { $match: matchFilters },
            {
                $group: {
                    _id: { isbn: '$isbn', grado: '$grado' },
                    // Tomar el primer libro como representante del grupo
                    book: { $first: '$$ROOT' },
                    // Contar total de copias en este grupo
                    totalCopies: { $sum: 1 }
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ['$book', { _groupedCopies: '$totalCopies' }]
                    }
                }
            },
            { $sort: { title: 1, grado: 1 } },
            { $skip: (options.page - 1) * options.limit },
            { $limit: options.limit }
        ];
        
        const groupedBooks = await Book.aggregate(aggregation);
        
        // Obtener información de disponibilidad para cada libro agrupado
        const booksWithAvailability = await Promise.all(
            groupedBooks.map(async (bookDoc) => {
                // Convertir el documento de agregación a un documento de Mongoose
                const book = new Book(bookDoc);
                const availability = await book.getAvailabilityInfo();
                return {
                    ...bookDoc,
                    availability
                };
            })
        );
        
        // Contar total de grupos únicos (no copias individuales)
        const totalAggregation = await Book.aggregate([
            { $match: matchFilters },
            {
                $group: {
                    _id: { isbn: '$isbn', grado: '$grado' }
                }
            },
            { $count: 'total' }
        ]);
        
        const total = totalAggregation.length > 0 ? totalAggregation[0].total : 0;
        
        res.status(200).json({
            success: true,
            data: booksWithAvailability,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los libros',
            error: error.message
        });
    }
};

// Obtener libro por ID con información detallada de disponibilidad
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }
        
        // Obtener información detallada de disponibilidad
        const availability = await book.getAvailabilityInfo();
        
        // Obtener todas las copias de este libro
        const copies = await Loan.find({ bookId: book._id })
            .populate('studentId', 'name idNumber grade')
            .sort({ copyNumber: 1 });
        
        res.status(200).json({
            success: true,
            data: {
                book,
                availability,
                copies
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el libro',
            error: error.message
        });
    }
};

// Crear nuevo libro
const createBook = async (req, res) => {
    try {
        console.log('� === INICIO DE CREACIÓN DE LIBRO ===');
        console.log('📝 req.body completo:', JSON.stringify(req.body, null, 2));
        console.log('� req.file:', req.file ? 'Archivo presente' : 'Sin archivo');
        console.log('📊 Headers:', req.headers['content-type']);
        
        // Extraer datos básicos primero
        let { title, author, isbn } = req.body;
        
        console.log('� Campos básicos extraídos:', { title, author, isbn });
        
        // Validación básica
        if (!title || !author || !isbn) {
            console.log('❌ Validación básica fallida');
            return res.status(400).json({
                success: false,
                message: 'Título, autor e ISBN son requeridos',
                received: { title, author, isbn }
            });
        }
        
        // Verificar ISBN duplicado
        console.log('🔍 Verificando ISBN duplicado...');
        const bookExists = await Book.findOne({ 
            isbn: isbn.toString().trim(),
            isActive: true 
        });
        if (bookExists) {
            console.log('❌ ISBN duplicado encontrado:', bookExists._id);
            return res.status(409).json({ // 409 Conflict es más apropiado que 400
                success: false,
                message: 'Ya existe un libro activo con este ISBN',
                existingBook: {
                    id: bookExists._id,
                    title: bookExists.title,
                    author: bookExists.author,
                    isbn: bookExists.isbn
                },
                suggestion: 'Puedes editar el libro existente o verificar si es un título diferente'
            });
        }
        
        // Crear un libro con datos mínimos primero
        console.log('📖 Creando libro con datos completos...');
        const bookData = {
            title: title.toString().trim(),
            author: author.toString().trim(),
            isbn: isbn.toString().trim(),
            genre: req.body.genre ? (Array.isArray(req.body.genre) ? req.body.genre : [req.body.genre]) : [],
            publishedYear: req.body.publishedYear ? parseInt(req.body.publishedYear) : undefined,
            location: req.body.location ? req.body.location.toString().trim() : '',
            description: req.body.description ? req.body.description.toString().trim() : '',
            language: req.body.language ? req.body.language.toString().trim() : '',
            publisher: req.body.publisher ? req.body.publisher.toString().trim() : '',
            pages: req.body.pages ? parseInt(req.body.pages) : undefined,
            estadoLibro: req.body.estadoLibro || 'Bueno',
            grado: req.body.grado ? req.body.grado.toString().trim() : '',
            initialCopies: req.body.initialCopies ? parseInt(req.body.initialCopies) : 1,
            coverImage: req.body.coverImage || ''
        };
        
        console.log('📝 Datos completos a insertar:', JSON.stringify(bookData, null, 2));
        
        const book = new Book(bookData);
        
        console.log('💾 Intentando guardar libro...');
        await book.save();
        console.log('✅ Libro guardado exitosamente con ID:', book._id);
        
        // Crear copias iniciales
        console.log(`📋 Creando ${book.initialCopies} copias iniciales...`);
        console.log('🔍 book.initialCopies valor:', book.initialCopies, 'tipo:', typeof book.initialCopies);
        
        // Validar y asegurar que sea un número
        const copiesToCreate = Math.max(1, Math.min(100, parseInt(book.initialCopies) || 1));
        console.log('🔍 copiesToCreate final:', copiesToCreate);
        
        let copiesCreatedCount = 0;
        
        if (copiesToCreate > 0) {
            const copies = [];
            for (let i = 1; i <= copiesToCreate; i++) {
                console.log(`📝 Creando copia ${i}`);
                copies.push({
                    bookId: book._id,
                    copyNumber: i,
                    status: 'disponible',
                    isBorrowed: false,
                    userId: null,
                    tipoPersona: null
                    // NO agregar loanStartDate ni dueDate para copias disponibles
                });
            }
            
            console.log(`💾 Insertando ${copies.length} copias...`);
            const result = await Loan.insertMany(copies);
            copiesCreatedCount = result.length;
            console.log(`✅ ${copiesCreatedCount} copias creadas exitosamente`);
        } else {
            console.log('⚠️ No se crearán copias (copiesToCreate = 0)');
        }

        // Registrar log de creación de libro
        await Log.crear({
            tipo: 'INFO',
            categoria: 'BOOK',
            accion: 'BOOK_CREATED',
            descripcion: `Libro creado: "${book.title}" por ${book.author} (ISBN: ${book.isbn})`,
            usuario: req.user.id,
            usuarioNombre: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            datos: {
                bookId: book._id,
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                copiesCreated: copiesCreatedCount,
                genre: book.genre
            }
        });
        
        // Obtener información de disponibilidad
        const availability = await book.getAvailabilityInfo();
        console.log('📊 Disponibilidad:', availability);
        
        // Respuesta completa con disponibilidad
        res.status(201).json({
            success: true,
            message: 'Libro creado exitosamente con copias',
            data: { 
                book: {
                    ...book.toObject(),
                    availability
                }
            }
        });
        
    } catch (error) {
        console.error('💥 Error completo:', error);
        console.error('📍 Stack trace:', error.stack);
        console.error('🏷️ Error name:', error.name);
        console.error('💬 Error message:', error.message);
        
        if (error.code === 11000) {
            console.log('❌ Error de duplicado detectado');
            return res.status(400).json({
                success: false,
                message: 'Ya existe un libro con este ISBN'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al crear el libro',
            error: error.message,
            details: error.toString()
        });
    }
};

// Actualizar un libro
const updateBook = async (req, res) => {
    try {
        console.log('📝 === INICIO DE ACTUALIZACIÓN DE LIBRO ===');
        console.log('🆔 ID del libro:', req.params.id);
        console.log('📊 req.body completo:', JSON.stringify(req.body, null, 2));
        console.log('🖼️ req.file:', req.file ? 'Archivo presente' : 'Sin archivo');
        console.log('🔗 coverImage en body:', req.body.coverImage || 'No hay coverImage en body');
        
        const { id } = req.params;
        const updates = { ...req.body };
        
        // Remover campos que no se deben actualizar directamente
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;
        
        // Procesamiento especial para arrays
        if (updates.genre) {
            try {
                // Si viene como string JSON, parsearlo
                if (typeof updates.genre === 'string' && updates.genre.startsWith('[')) {
                    updates.genre = JSON.parse(updates.genre);
                } else if (typeof updates.genre === 'string') {
                    // Si es un string simple, convertirlo a array
                    updates.genre = updates.genre.split(',').map(g => g.trim()).filter(g => g);
                }
            } catch (e) {
                console.log('⚠️ Error parseando género, usando como string:', updates.genre);
            }
        }
        
        // Procesar autores - asegurar que sea siempre un string
        if (updates.author) {
            if (Array.isArray(updates.author)) {
                // Si viene como array, convertir a string
                updates.author = updates.author.join(', ');
                console.log('✅ Autores convertidos de array a string:', updates.author);
            } else if (typeof updates.author === 'string' && updates.author.includes(',')) {
                // Normalizar autores múltiples si vienen como string con comas
                updates.author = updates.author.split(',').map(a => a.trim()).join(', ');
            }
            console.log('📝 Author final:', updates.author, typeof updates.author);
        }
        
        console.log('🔄 Datos a actualizar:', JSON.stringify(updates, null, 2));
        
        const book = await Book.findByIdAndUpdate(
            id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );
        
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }
        
        console.log('✅ Libro actualizado exitosamente');
        
        // Obtener información de disponibilidad actualizada
        // const availability = await book.getAvailabilityInfo(); // TEMPORAL: comentado para debug
        
        res.status(200).json({
            success: true,
            message: 'Libro actualizado exitosamente',
            data: {
                book
                // availability // TEMPORAL: comentado para debug
            }
        });
        
    } catch (error) {
        console.error('💥 Error actualizando libro:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un libro con este ISBN'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el libro',
            error: error.message
        });
    }
};

// Desactivar un libro (soft delete)
const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el libro tiene préstamos activos
        const activeLoans = await Loan.find({
            bookId: id,
            isBorrowed: true,
            status: { $in: ['prestado', 'atrasado'] }
        });
        
        if (activeLoans.length > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede desactivar el libro. Tiene ${activeLoans.length} préstamos activos`,
                data: { activeLoans: activeLoans.length }
            });
        }
        
        const book = await Book.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );
        
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Libro desactivado exitosamente',
            data: book
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al desactivar el libro',
            error: error.message
        });
    }
};

// Búsqueda avanzada de libros
const searchBooks = async (req, res) => {
    try {
        const { search, genre, author, publishedYear, available } = req.query;
        const { page = 1, limit = 20 } = req.query;
        
        let filters = { isActive: true };
        
        if (search) {
            filters.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { isbn: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (genre) {
            filters.genre = { $in: [genre] };
        }
        
        if (author) {
            filters.author = { $regex: author, $options: 'i' };
        }
        
        if (publishedYear) {
            filters.publishedYear = publishedYear;
        }
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        let books = await Book.find(filters)
            .sort({ title: 1 })
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);
        
        // Si se solicita filtrar por disponibilidad
        if (available === 'true') {
            const booksWithAvailability = await Promise.all(
                books.map(async (book) => {
                    const availability = await book.getAvailabilityInfo();
                    return {
                        book,
                        availability,
                        isAvailable: availability.availableCopies > 0
                    };
                })
            );
            
            books = booksWithAvailability
                .filter(item => item.isAvailable)
                .map(item => ({
                    ...item.book.toObject(),
                    availability: item.availability
                }));
        } else {
            // Agregar información de disponibilidad a todos los libros
            books = await Promise.all(
                books.map(async (book) => {
                    const availability = await book.getAvailabilityInfo();
                    return {
                        ...book.toObject(),
                        availability
                    };
                })
            );
        }
        
        const total = await Book.countDocuments(filters);
        
        res.status(200).json({
            success: true,
            data: books,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en la búsqueda de libros',
            error: error.message
        });
    }
};

// Obtener disponibilidad específica de un libro
const getBookAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        
        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }
        
        const availability = await book.getAvailabilityInfo();
        
        // Obtener detalles de cada copia
        const copies = await Loan.find({ bookId: id })
            .populate('studentId', 'name idNumber grade')
            .sort({ copyNumber: 1 });
        
        res.status(200).json({
            success: true,
            data: {
                book: book.basicInfo,
                availability,
                copies
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la disponibilidad del libro',
            error: error.message
        });
    }
};

// Crear múltiples libros (bulk create)
const createBulkBooks = async (req, res) => {
    try {
        const booksData = req.body;

        if (!Array.isArray(booksData) || booksData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se espera un array de libros para la creación masiva'
            });
        }

    // Permitir coverImage, estadoLibro y grado en creación masiva
    const createdBooks = await Book.insertMany(booksData, { ordered: false });
        
        // Crear copias iniciales para cada libro
        const allCopies = [];
        createdBooks.forEach(book => {
            const initialCopies = book.initialCopies || 1;
            for (let i = 1; i <= initialCopies; i++) {
                allCopies.push({
                    bookId: book._id,
                    studentId: null,
                    copyNumber: i,
                    isBorrowed: false,
                    status: 'disponible',
                    loanStartDate: new Date(),
                    dueDate: new Date()
                });
            }
        });
        
        await Loan.insertMany(allCopies);
        
        res.status(201).json({
            success: true,
            message: `${createdBooks.length} libros creados exitosamente`,
            data: createdBooks
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en la creación masiva de libros',
            error: error.message,
            details: error.writeErrors
        });
    }
};

// Obtener copias de un libro
const getBookCopies = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el libro existe
        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Obtener todas las copias del libro (disponibles, prestadas, etc.)
        // Excluir SOLO solicitudes pendientes, rechazadas y copias eliminadas
        const copies = await Loan.find({ 
            bookId: id,
            isActive: true,  // Solo copias activas (no eliminadas)
            status: { $nin: ['pendiente', 'rechazado'] }  // Excluir solo solicitudes
        })
        .populate('userId', 'username')
        .sort({ copyNumber: 1 });

        // Si hay copias sin copyNumber, asignarles números consecutivos
        if (copies.length > 0) {
            // Encontrar el máximo copyNumber existente
            const maxCopyNumber = copies.reduce((max, copy) => {
                return copy.copyNumber > max ? copy.copyNumber : max;
            }, 0);
            
            let nextNumber = maxCopyNumber + 1;
            
            // Asignar números solo a las copias que no lo tienen
            for (const copy of copies) {
                if (!copy.copyNumber || copy.copyNumber === 0) {
                    copy.copyNumber = nextNumber;
                    await copy.save();
                    nextNumber++;
                }
            }
        }

        res.status(200).json({
            success: true,
            copies: copies,
            totalCopies: copies.length
        });

    } catch (error) {
        console.error('Error obteniendo copias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener copias del libro',
            error: error.message
        });
    }
};

// Agregar copias a un libro
const addBookCopies = async (req, res) => {
    try {
        const { id } = req.params;
        const { numberOfCopies = 1 } = req.body;

        // Validar número de copias
        const copiesToAdd = Math.max(1, Math.min(50, parseInt(numberOfCopies) || 1));

        // Verificar que el libro existe
        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Obtener el último número de copia (solo copias reales, no solicitudes)
        const lastCopy = await Loan.findOne({ 
            bookId: id,
            copyNumber: { $exists: true, $ne: null },
            status: { $in: ['disponible', 'prestado', 'atrasado', 'devuelto', 'dañado', 'perdido'] }
        })
        .sort({ copyNumber: -1 })
        .select('copyNumber');

        const nextCopyNumber = (lastCopy?.copyNumber || 0) + 1;

        // Crear nuevas copias
        const newCopies = [];
        for (let i = 0; i < copiesToAdd; i++) {
            newCopies.push({
                bookId: id,
                copyNumber: nextCopyNumber + i,
                status: 'disponible',
                isBorrowed: false,
                userId: null,
                tipoPersona: null
                // NO incluir loanStartDate ni dueDate para copias disponibles
            });
        }

        const createdCopies = await Loan.insertMany(newCopies);

        // Registrar log
        await Log.crear({
            tipo: 'INFO',
            categoria: 'BOOK',
            accion: 'BOOK_COPIES_ADDED',
            descripcion: `Agregadas ${copiesToAdd} copia(s) al libro "${book.title}"`,
            usuario: req.user.id,
            usuarioNombre: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            datos: {
                bookId: id,
                copiesAdded: copiesToAdd,
                newCopyNumbers: createdCopies.map(c => c.copyNumber)
            }
        });

        res.status(201).json({
            success: true,
            message: `${copiesToAdd} copia(s) agregada(s) exitosamente`,
            copiesAdded: copiesToAdd,
            newCopies: createdCopies
        });

    } catch (error) {
        console.error('Error agregando copias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar copias',
            error: error.message
        });
    }
};

// Actualizar una copia
const updateBookCopy = async (req, res) => {
    try {
        const { copyId } = req.params;
        const { status, notes } = req.body;

        // Verificar que la copia existe
        const copy = await Loan.findById(copyId);
        if (!copy) {
            return res.status(404).json({
                success: false,
                message: 'Copia no encontrada'
            });
        }

        // Actualizar copia
        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        const updatedCopy = await Loan.findByIdAndUpdate(
            copyId,
            updateData,
            { new: true }
        ).populate('bookId', 'title author');

        // Registrar log
        await Log.crear({
            tipo: 'INFO',
            categoria: 'BOOK',
            accion: 'BOOK_COPY_UPDATED',
            descripcion: `Actualizada copia #${copy.copyNumber} del libro "${copy.bookId?.title}"`,
            usuario: req.user.id,
            usuarioNombre: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            datos: {
                copyId: copyId,
                copyNumber: copy.copyNumber,
                bookId: copy.bookId,
                updateData: updateData
            }
        });

        res.status(200).json({
            success: true,
            message: 'Copia actualizada exitosamente',
            copy: updatedCopy
        });

    } catch (error) {
        console.error('Error actualizando copia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar copia',
            error: error.message
        });
    }
};

// Eliminar una copia
const deleteBookCopy = async (req, res) => {
    try {
        const { copyId } = req.params;

        // Verificar que la copia existe
        const copy = await Loan.findById(copyId);
        if (!copy) {
            return res.status(404).json({
                success: false,
                message: 'Copia no encontrada'
            });
        }

        // No permitir eliminar copias prestadas
        if (copy.isBorrowed) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar una copia que está prestada'
            });
        }

        // Soft delete de la copia
        copy.isActive = false;
        copy.status = 'eliminado';
        await copy.save();

        // Registrar log
        await Log.crear({
            tipo: 'INFO',
            categoria: 'BOOK',
            accion: 'BOOK_COPY_DELETED',
            descripcion: `Eliminada copia #${copy.copyNumber} del libro "${copy.bookId?.title}"`,
            usuario: req.user.id,
            usuarioNombre: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            datos: {
                copyId: copyId,
                copyNumber: copy.copyNumber,
                bookId: copy.bookId
            }
        });

        res.status(200).json({
            success: true,
            message: 'Copia eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando copia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar copia',
            error: error.message
        });
    }
};

module.exports = {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    searchBooks,
    getBookAvailability,
    createBulkBooks,
    getBookCopies,
    addBookCopies,
    updateBookCopy,
    deleteBookCopy
};



