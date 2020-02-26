/**** DEPENDENCIES ****/
const express = require('express')
const ping = require('domain-ping')
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
app.post('/new-query', (request, response) => {
  const url = request.body.url

  Query.findOne({ url: url }).then(async query => {
    if (query) {
      query.visitCount++
      query.save().then(savedQuery => {
        res.json(savedQuery.toJSON())
      })
      res.json(query.toJSON())
    } else {
      ping(url)
        .then((res) => {
          return res.ip;
        }).then(res => {
          return axios.get(`http://api.ipstack.com/${res}?access_key=${IPSTACK_KEY}`);
        }).then(res => {
          const newQuery = new Query({
            url,
            visitCount: 1,
            city: res.data.city,
            state: res.data.region_name,
            country: res.data.country_name,
            latitude: res.data.latitude,
            longitude: res.data.longitude
          })

          newQuery.save().then(savedQuery => {
            response.json(savedQuery.toJSON())
          })
        }).catch((error) => {
          console.error(error);
        });

    }
  })
})

/**** START SERVER ****/
app.listen(PORT, () => {
  console.log('server running on port ' + PORT)
})
