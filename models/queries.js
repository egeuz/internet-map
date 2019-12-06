const mongoose = require('mongoose')

const querySchema = new mongoose.Schema({
  url: String,
  ip: String,
  visitCount: Number,
  city: String,
  state: String,
  country: String,
  latitude: String,
  longitude: String
})

module.exports = mongoose.model('Query', querySchema)