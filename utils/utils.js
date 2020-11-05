//URI for mongodb database
const Mongodb_URI = process.env.URI;

//mongodb object to connect with
const MongoClient = require('mongodb').MongoClient;
const Client = new MongoClient(Mongodb_URI, {useNewUrlParser: true, useUnifiedTopology: true});


module.exports = { Mongodb_URI, Client }