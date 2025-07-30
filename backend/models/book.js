const mongoose = require ('mongoose');

const BookSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    author:{
        type:String,
        required:true,
        trim:true
    },
    isbn:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    genre:{
        type:[String],
        default:[]        
    },
    publishedYear:{
        type:Number
    },
    stock:{
        type: Number,
        required: true,
        default: 1,
        min: 0
    },
    location: {
        type: String,
        trim: true,
        default: 'Estante General'
},

} ,{
    timestamps: true
}

)

module.exports =mongoose.model('Book', BookSchema);