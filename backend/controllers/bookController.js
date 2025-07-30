const Book = require('../models/book');

const getBooks = async (req, res) =>{
    try{
        const books= await Book.find({});
        res.status(200).json(books);
    } catch (error){
        res.status(500).json({message:'Error al obtener los libros', error: error.message});
    }


}; 

const getBookById =async (req, res) =>{
    try{
        const book= await Book.findById(req.params.id);
        if (book){
            res.status(200).json(book);
        }else {
            res.status(404).json({message: 'Libro no encontrado'});
        }
    }catch (error){
        res.status(500).json({message: 'Error al obtener el libro'});
    }
}

const createBook = async (req, res) => {
    const { title, author, isbn, genre, publishedYear, stock, location } = req.body;

    // Validación básica
    if (!title || !author || !isbn || !stock) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos requeridos.' });
    }

    try {
        const bookExists = await Book.findOne({ isbn });
        if (bookExists) {
            return res.status(400).json({ message: 'Ya existe un libro con este ISBN.' });
        }

        const book = new Book({
            title,
            author,
            isbn,
            genre,
            publishedYear,
            stock,
            location
        });

        const createdBook = await book.save();
        res.status(201).json(createdBook);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear libro', error: error.message });
    }
};
// @desc    Actualizar un libro
// @route   PUT /api/books/:id
// @access  Private
const updateBook = async (req, res) => {
    const { title, author, isbn,genre,  publishedYear, stock, location } = req.body;

    try {
        const book = await Book.findById(req.params.id);

        if (book) {
            book.title = title || book.title;
            book.author = author || book.author;
            book.isbn = isbn || book.isbn;
            book.publishedYear = publishedYear || book.publishedYear;
            book.genre = genre || book.genre;
            book.location =location || book.location;
            book.stock = stock !== undefined ? stock : book.stock; // Para permitir stock 0

            const updatedBook = await book.save();
            res.status(200).json(updatedBook);
        } else {
            res.status(404).json({ message: 'Libro no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar libro', error: error.message });
    }
};

// @desc    Eliminar un libro
// @route   DELETE /api/books/:id
// @access  Private
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (book) {
            await Book.deleteOne({ _id: book._id }); // Usar deleteOne para la eliminación
            res.status(200).json({ message: 'Libro eliminado' });
        } else {
            res.status(404).json({ message: 'Libro no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar libro', error: error.message });
    }
};

module.exports = {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
};



