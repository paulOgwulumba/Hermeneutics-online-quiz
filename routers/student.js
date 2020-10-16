const { response } = require('express');
const express = require('express');
const session = require('express-session');
const { request } = require('http');
const student = express.Router()
const path = require('path')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const Datastore = require('nedb');

const student_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'student_base.db'), autoload: true},)
const answers_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'answers_base.db'), autoload: true})
const session_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'session_base.db'), autoload: true})

//set up session middleware
student.use(session({secret: "jets", saveUninitialized: true, resave: true}))

module.exports = admin