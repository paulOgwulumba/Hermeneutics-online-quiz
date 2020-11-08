//  URI for mongodb database
//  const Mongodb_URI = process.env.URI;

//  For development purposes only
const MongodbURI = 'mongodb://127.0.0.1:27017'

//  mongodb object to connect with
const MongoClient = require('mongodb').MongoClient
const Client = new MongoClient(MongodbURI, { useNewUrlParser: true, useUnifiedTopology: true })

module.exports = { MongodbURI, Client }
