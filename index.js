/**** DEPENDENCIES ****/
const express = require('express')
const ping = require('ping')
const axios = require('axios')

/**** MIDDLEWARE ****/
const bodyParser = require('body-parser')

/**** SETUP APP + CONNECT TO FRONTEND ****/
const app = express()
app.use(bodyParser.json())
app.use(express.static('public'))

/**** ENVIRONMENT VARIABLES ****/
require('dotenv').config()
const IPSTACK_KEY = process.env.IPSTACK_KEY
const PORT = process.env.PORT
const MONGODB_URI = process.env.MONGODB_URI

/**** CONNECT TO DATABASE ****/
const mongoose = require('mongoose')
const Query = require('./models/queries')
mongoose.connect(MONGODB_URI, { useNewUrlParser: true })

/**** BROWSER HISTORY DATA ****/
app.get('/all-queries', (req, res) => {
  Query.find({}).then(queries => {
    res.json(queries)
  })
})

/**** PREP AND SEND BROWSER HISTORY DATA ****/
app.post('/new-query', (req, res) => {
  const url = req.body.url

  Query.findOne({ url: url }).then(async query => {
    if (query) {
      query.visitCount++
      query.save().then(savedQuery => {
        res.json(savedQuery.toJSON())
      })
      res.json(query.toJSON())
    } else {
      const pingData = await ping.promise.probe(url, { timeout: 10 })
      const ip = pingData.numeric_host
      const location = await axios.get(`http://api.ipstack.com/${ip}?access_key=${IPSTACK_KEY}`)

      const newQuery = new Query({
        url,
        ip,
        visitCount: 1,
        city: location.data.city,
        state: location.data.region_name,
        country: location.data.country_name,
        latitude: location.data.latitude,
        longitude: location.data.longitude
      })

      newQuery.save().then(savedQuery => {
        res.json(savedQuery.toJSON())
      })
    }
  })
})

/**** START SERVER ****/
app.listen(PORT, () => {
  console.log('server running on port ' + PORT)
})
