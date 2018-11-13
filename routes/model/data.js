var mongoose = require('mongoose');
var Schema = new mongoose.Schema({
    message: String,
    worker: String,
    date: String,
    time: String,
    weightCollected: String,
	collectBin: {
		bin: String,
		label: String,
		location:String
	}
});

module.exports = mongoose.model('data', Schema);