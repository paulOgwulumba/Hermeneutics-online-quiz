const express = require('express');
const Datastore = require('nedb');
require('dotenv').config({path: __dirname + '/.env'});

const student_base =  new Datastore({filename: 'student_base.db', autoload: true})

const server = express();
server.use(express.json({limit: '1mb'}));
server.use(express.static('public'));

console.log(process.env.MY_NAME)

process.env['FIRE_CRACKER'] = "Run my love"

console.log(process.env.FIRE_CRACKER)

const PORT = process.env.PORT || 3000
server.listen(PORT, ()=> {
  console.log(`Listening on port: ${PORT}`)
})
