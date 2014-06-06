var mongoose = require('mongoose');

module.exports = {
	linkscheme: mongoose.Schema({
        url: {type: String, unique: true},
		visited: Boolean,
        depth: Number,
        date: Number,
        valid: Boolean,
        numberlinks: {type: Number, default: 0}
	})
}
