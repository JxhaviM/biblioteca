require ('dotenv').config();//ruta donde me conecto a mis variables de entorno
const express= require ('express');
const cors =require ('cors');
const morgan = require ('morgan');
const connectDB = require('./config/db');

const authRoutes =require ('./routes/authRoutes');
const bookRoutes =require ('./routes/bookRoutes')
const pqrRoutes = require('./routes/pqrRoutes');

const app =express();
connectDB();

//middlewares
app.use(cors()); //habilita CORS para todas las rutas
app.use(express.json());//habilita el parseo decl JSON en las solicitudes entrantes
app.use(morgan('dev')); //habilita el logging de solicitudes HTTP en la consola

//rutas
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/pqrs', pqrRoutes);

//ruta de prueba
app.get('/',(req, res)=>{
    res.status(202).json({ message :'la API esta funcionando'})
})

// manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});