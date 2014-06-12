var mongoose = require('mongoose');

module.exports = {
	linkscheme: mongoose.Schema({
        url: {type: String, unique: true},
		visited: Boolean,
        depth: Number,
        date: Number,
        valid: Boolean,
        pending: Boolean,
        referers: [ String ],
        numberlinks: {type: Number, default: 0}
	})
}
