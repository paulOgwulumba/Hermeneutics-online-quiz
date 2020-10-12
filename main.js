//Import express object
const express = require('express');

//Import routers
const adminRouter = require('./routers/admin');

//import database object
const Datastore = require('nedb');

//initialise environment variables
require('dotenv').config({path: __dirname + '/.env'});

//initialise database objects
const student_base =  new Datastore({filename: 'student_base.db', autoload: true})

//Initialise express object
const server = express();

//set up server
server.use(express.json({limit: '2mb'}));
server.use(express.static('public'));
server.use('/admin', adminRouter)

//console.log(process.env.MY_NAME)

//process.env['FIRE_CRACKER'] = "Run my love"

//console.log(process.env.FIRE_CRACKER)

const PORT = process.env.PORT || 3000
server.listen(PORT, ()=> {
  console.log(`Listening on port: ${PORT}`)
})
