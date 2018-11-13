var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var userSchema = new mongoose.Schema({
    username:{type:String,require:true},
    email:{type:String,require:true},
    phone: Number,
    password: {type:String,require:true},
    role: String,
    location: String,
    messages: [{
        message: String,
        date: Number
    }]
});
userSchema.methods.generatHarsh = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
};
userSchema.methods.validPassword =function (password) {
    return bcrypt.compareSync(password,this.password);
};
module.exports = mongoose.model('users', userSchema);