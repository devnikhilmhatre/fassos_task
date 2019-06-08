var mongoose = require('mongoose')
var ObjectId = mongoose.Schema.Types.ObjectId

var order = mongoose.Schema({
    user_id: { type: ObjectId },
    status: { type: String, default:'Not Delivered' },
    created: { type: Date, default: Date.now }
})

module.exports = mongoose.model("order", order);