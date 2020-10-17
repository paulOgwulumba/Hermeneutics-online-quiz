const { response } = require('express');
const express = require('express');
const session = require('express-session');
const { request } = require('http');
const student = express.Router()
const path = require('path')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const Datastore = require('nedb');

const student_db = require('../database_objects/student_db')
const answers_db = require('../database_objects/answers_db')
const session_db = require('../database_objects/session_db')

var authTokens = {}

//set up session middleware
student.use(session({secret: "jets", saveUninitialized: true, resave: true}));
student.use(bodyParser.urlencoded({extended: true}));
student.use(cookieParser());

//this appends a user object unique to the session id to any incoming request
student.use((request, response, next) => {
  //Get auth token from cookies
  const authToken = request.cookies['AuthToken'];

  request.user = authTokens[authToken]

  next()
})

//this middleware cancels the request if the request is made by user who is not logged in
const requireAuth = (request, response, next) => {
  if(request.user){
    next();
  }
  else{
    response.send({status: "FAILED"})
  }
}

//gets a student's log in attempt and runs authentication on it
student.post('/log-in', (request, response) => {
  let user = request.body;
  if('student_id' in user && 'password' in user){
    if(user.student_id === "" || user.password === ""){
      console.log(`Failed log in attempt to exam portal by empty Student ID or password: ${user.student_id}. Time: ${new Date().toLocaleString()}`)
      response.send({status: "Please enter your ID Number and password"});
    }
  }
  try{
    student_db.findOne({student_id: user.student_id}, (error, document) => {
      if(error) throw error
      if(document == null || document == undefined){
        console.log(`Failed log in attempt to exam portal by invalid Student ID: ${user.student_id}. Time: ${new Date().toLocaleString()}`)
        response.send({status: "Invalid student ID"});
      }
      else{
        if(document.password === user.password){
          console.log(`Successfull log in to exam portal by Student ID: ${user.student_id}. Time: ${new Date().toLocaleString()}`)
          authTokens[request.session.id] = document.name
          response.cookie("AuthToken", request.session.id)
          response.send({status: "OK"})
        }
        else{
            console.log(`Failed log in attempt to exam portal by Student ID: ${user.student_id} due to wrong password. Time: ${new Date().toLocaleString()}`)
            response.cookie('name', document.name)
            response.send({status: "Incorrect password"})
        }
      }
    })
  }
  catch(error){
    console.error(error)
    console.log(`Attempted log in to exam portal by Student ID: ${user.student_id} failed due to database error. Time: ${new Date().toLocaleString()}`)
    response.status(404).send({status: "Server error!"})
  }
})

student.get('/session', requireAuth, (request, response) => {
  response.send({status: "OK"})
})
module.exports = student