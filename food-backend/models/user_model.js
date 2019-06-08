var mongoose = require('mongoose')

var user = mongoose.Schema({
    name: { type: String },
    created: { type: Date, default: Date.now() }
})

module.exports = mongoose.model("user", user);