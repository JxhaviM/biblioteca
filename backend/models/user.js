const mongoose = require('mongoose');
const bcrypt = require ('bcryptjs');

const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    pasword:{
        type:String,
        required:true,
        minLength:6
    }
    },{
        timestamps:true
    
});

    //middleware para hashear contraseña antes de guardar
UserSchema.pre('save', async function(next){
    if (!this.isModified('password')){
        return next();
    }
    const salt =await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();

});

//metodo para comprar contraseñas
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);













