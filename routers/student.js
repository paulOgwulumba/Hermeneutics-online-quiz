const { response } = require('express');
const express = require('express');
const session = require('express-session');
const { request } = require('http');
const student = express.Router()
const path = require('path')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

student.use(cookieParser())

//keeps track of all the student sessions to make sure that no single student has two sessions running simultaneously
//each document in this database has two fields: 'name' & 'session_id'
const session_tracker_db =  require('../database_objects/session_tracker_db'); 
//stores student information
const student_db = require('../database_objects/student_db')
//stores the answer sheet of students
const answers_db = require('../database_objects/answers_db')
//stores information about the exams taken by the student
const session_db = require('../database_objects/session_db')


//set up session middleware
student.use(session({secret: "jets", saveUninitialized: true, resave: true}));
student.use(bodyParser.urlencoded({extended: true}));
student.use(cookieParser());

//this appends a user object unique to the session id to any incoming request
student.use((request, response, next) => {
  //Get auth token from cookies
  let authToken = request.session.id;

  //sorts through the session tracker database to see what user is attached to authToken
  try{
    session_tracker_db.findOne({session_id: authToken}, (error, document) => {
      if(error) throw error
      //if a match is found, append the name of the student to the request and pass it on
      if(document !== null && document !== undefined){
        console.log("here")
        request.user = document.name;
      }
      next()
    })
  }
  catch(error){
    console.error(error)
    next()
  }
})

//this middleware cancels the request if the request is made by user who is not logged in
const requireAuth = (request, response, next) => {
  if(request.user){
    next();
  }
  else{
    console.log(`Blocked server request from student that is not logged in. Time: ${new Date().toLocaleString()}`)
    response.send({status: "LOG OUT"});
    response.end()
  }
}

//gets a student's log in attempt and runs authentication on it
student.post('/log-in', (request, response) => {
  let user = request.body;
  try{
    //checks for empty username and/or password
    if(user.student_id === "" || user.password === ""){
      console.log(`Failed log in attempt to exam portal by empty Student ID or password: ${user.student_id}. Time: ${new Date().toLocaleString()}`)
      response.send({status: "Please enter your ID Number and password"});
      response.end()
    }
    else{
      student_db.findOne({student_id: user.student_id}, (error, document) => {
        if(error) throw error
        //checks for invalid student id
        if(document == null || document == undefined){
          console.log(`Failed log in attempt to exam portal by invalid Student ID: ${user.student_id}. Time: ${new Date().toLocaleString()}`)
          response.send({status: "Invalid student ID"});
        }
        else{
          //correct username and password
          if(document.password === user.password){
            console.log(`Successfull log in to exam portal by Student ID: ${user.student_id}. Time: ${new Date().toLocaleString()}`)
            //update session tracker database
            session_tracker_db.update({name: document.name, _id: document._id}, {$set: {session_id: request.session.id}}, {upsert: true, returnUpdatedDocs: true}, (error, noOfUpdated, affectedDocs, upsert) => {
              console.log("This file was updated")
              console.log(affectedDocs)
            })
            //set cookie
            
            response.send({status: "OK"})
          }
          else{
              console.log(`Failed log in attempt to exam portal by Student ID: ${user.student_id} due to wrong password. Time: ${new Date().toLocaleString()}`)
              response.send({status: "Incorrect password"})
          }
        }
      })
  
    }
  }
  catch(error){
    console.error(error)
    console.log(`Attempted log in to exam portal by Student ID: ${user.student_id} failed due to database error. Time: ${new Date().toLocaleString()}`)
    response.status(404).send({status: "Server error!"})
  }
})

//checks if the student is logged in or not
student.get('/session', requireAuth, (request, response) => {

  response.send({status: "OK"})
})

//checks if multiple people logged into one student account or not
student.get('/login-status', requireAuth, (request, response) => {
  let name = request.user;
  try{
    session_tracker_db.findOne({name: name, session_id: request.session.id}, (error, document) => {
      if(document == null || document == undefined){
        console.log(`Checked log in status for ${name}. Status failed, second-party already logged into account. Time: ${new Date().toLocaleString()}`)
        response.send({status: "FAILED"});
      }
      else{
        console.log(`Checked log in status for ${name}. Status is okay, no second-party logged into same account. Time: ${new Date().toLocaleString()}`)
        response.send({status: "OK"});
      }
    })
  }
  catch(err){
    console.error(error)
    response.send({status: "FAILED"})
  }
})
module.exports = student