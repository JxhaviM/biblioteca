const Book = require('../models/book');
const Loan = require('../models/loan');

// Obtener todos los libros con información de disponibilidad
const getBooks = async (req, res) => {
    try {
        const { page = 1, limit = 50, search, genre, isActive = true } = req.query;
        
        // Construir filtros
        let filters = { isActive: isActive === 'true' };
        
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
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        const books = await Book.find(filters)
            .sort({ title: 1 })
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);
        
        // Obtener información de disponibilidad para cada libro
        const booksWithAvailability = await Promise.all(
            books.map(async (book) => {
                const availability = await book.getAvailabilityInfo();
                return {
                    ...book.toObject(),
                    availability
                };
            })
        );
        
        const total = await Book.countDocuments(filters);
        
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
        const { 
            title, 
            author, 
            isbn, 
            genre, 
            publishedYear, 
            location, 
            description, 
            language, 
            publisher, 
            pages, 
            initialCopies = 1 
        } = req.body;

        // Validaciones básicas
        if (!title || !author || !isbn) {
            return res.status(400).json({
                success: false,
                message: 'Título, autor e ISBN son requeridos'
            });
        }

        // Verificar si ya existe un libro con ese ISBN
        const bookExists = await Book.findOne({ isbn });
        if (bookExists) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un libro con este ISBN'
            });
        }

        const book = new Book({
            title,
            author,
            isbn,
            genre,
            publishedYear,
            location,
            description,
            language,
            publisher,
            pages
        });

        await book.save();
        
        // Crear las copias iniciales del libro
        const copies = [];
        for (let i = 1; i <= initialCopies; i++) {
            copies.push({
                bookId: book._id,
                studentId: null,
                copyNumber: i,
                isBorrowed: false,
                status: 'disponible',
                loanStartDate: new Date(),
                dueDate: new Date()
            });
        }
        
        await Loan.insertMany(copies);
        
        // Obtener el libro con información de disponibilidad
        const availability = await book.getAvailabilityInfo();
        
        res.status(201).json({
            success: true,
            message: `Libro creado exitosamente con ${initialCopies} copias`,
            data: {
                book,
                availability
            }
        });
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un libro con este ISBN'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al crear el libro',
            error: error.message
        });
    }
};

// Actualizar un libro
const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remover campos que no se deben actualizar directamente
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;
        
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
        
        // Obtener información de disponibilidad actualizada
        const availability = await book.getAvailabilityInfo();
        
        res.status(200).json({
            success: true,
            message: 'Libro actualizado exitosamente',
            data: {
                book,
                availability
            }
        });
        
    } catch (error) {
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

module.exports = {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    searchBooks,
    getBookAvailability,
    createBulkBooks
};



