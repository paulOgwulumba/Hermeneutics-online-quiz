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

//this appends a user and _id object unique to the session id to any incoming request
student.use((request, response, next) => {
  //Get auth token from cookies
  let authToken = request.cookies["AuthToken"];

  //sorts through the session tracker database to see what user is attached to authToken
  try{
    session_tracker_db.findOne({session_id: authToken}, (error, document) => {
      if(error) throw error
      //if a match is found, append the name of the student to the request and pass it on
      if(document !== null && document !== undefined){
        request.user = document.name;
        request._id = document._id;
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
    console.log(`Blocked server request from student that is not logged in. session id: ${request.session.id}. Time: ${new Date().toLocaleString()}`)
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
      student_db.findOne({student_id: user.student_id}, async (error, document) => {
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
            
            // request.session.cookie["AuthToken"] = request.session.id
            response.cookie("AuthToken", request.session.id)
            await session_tracker_db.remove({name: document.name, _id: document._id}, {multi: true}, async (error, number) => {
              if(error) throw error
              await session_tracker_db.insert({name: document.name, _id: document._id, session_id: request.session.id}, (error, doc) => {
              })
            })
            //set cookie
            
            response.send({status: "OK", _id: document._id})
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
  let _id = request._id;
  try{
    session_db.findOne({_id: _id}, (error, document) => {
      if(error) throw error;
      //exam not already in session approve start of exam
      if(document.exam_status === 'not taken'){
        console.log(`Student (${request.user}) exam initializing attempt approved. Time: ${new Date().toLocaleString()} `);
        response.send({status: "OK"})
      }
      //exam in session, approve continuation of exam
      else if(document.exam_status === 'in session'){
        answers_db.findOne({_id: _id}, (error, doc) => {
          if(error) throw error
          console.log(`Student (${request.user}) exam continuation attempt approved. Time: ${new Date().toLocaleString()} `);
          response.send({status: "CONTINUE", session: document, answers: doc.answers});
        })
      }
      //exam session already ended, disapprove
      else{
        console.log(`Student (${request.user}) exam initialization attempt blocked because he/she already took the exam. Time: ${new Date().toLocaleString()} `);
        response.send({status: "TAKEN"})
      }
    })
  }
  catch(error){
    console.error(error)
    console.log(`Student (${request.user}) exam starting attempt blocked because of database error while fetching exam session state. Time: ${new Date().toLocaleString()} `);
    response.send({status: "LOG OUT"})
  }
})

//checks if multiple people logged into one student account or not
student.get('/login-status', requireAuth, (request, response) => {
  let name = request.user;
  try{
    session_tracker_db.findOne({name: name, session_id: request.session.id}, (error, document) => {
      if(document == null || document == undefined){
        console.log(`Checked log in status for ${name} with session id: ${request.session.id}. Status failed, second-party already logged into account. Time: ${new Date().toLocaleString()}`)
        response.send({status: "FAILED"});
      }
      else{
        console.log(`Checked log in status for ${name} session id: ${request.session.id}. Status is okay, no second-party logged into same account. Time: ${new Date().toLocaleString()}`)
        response.send({status: "OK"});
      }
    })
  }
  catch(err){
    console.error(error)
    response.send({status: "FAILED"})
  }
})

//starts the exam and creates a timeout that terminates the exam after 2hr 15 mins window is passed
student.get('/start-exam', (request, response) => {
  //gets database id attached to request
  let _id = request._id;
  //updates exam session information
  session_db.update({_id: _id}, {$set: {exam_status: 'in session', time_stamp: {start: new Date().toLocaleString()}}}, {})
  console.log(`Student exam session started successfully. _id: ${_id}. Time: ${new Date().toLocaleString()}`)
  //makes sure the exam session automatically ends after a maximum of 2hrs and 15 minutes if student does not end the exam
  setTimeout(() => {
    //get session information from database
    session_db.findOne({_id: _id}, (error, document) => {
      if(error) throw error
      //check if exam has been submitted already and submit it if it hasn't already
      if(document.exam_status !== 'taken'){
        session_db.update({_id: _id}, {$set: {exam_status: 'taken', "time_stamp.stop": new Date().toLocaleString()}}, {})
        console.log(`Exam forcefully submitted because 2hr 15mins exam window has passed. _id:${_id}. Time: ${new Date().toLocaleString()}`)
      }
    })
  }, 8100000)
  
  response.send({status: "OK"})
})

//adds answers to the database
student.post('/exam', requireAuth, (request, response) => {
  let _id = request._id;
  session_db.update({_id: _id}, {$set: {current_question: request.body.current_question, time_left: request.body.secondsLeft}}, {})
  answers_db.update({_id: _id}, {$set: {answers: request.body.answers}}, {})
  console.log(`Student exam answers, current question and time left updated successfully. _id: ${_id}. Time: ${new Date().toLocaleString()}`)
  response.send({status: "OK"})
})

//ends the exam
student.post('/stop-exam', requireAuth,(request, response) => {
  let _id = request._id;
  session_db.update({_id: _id}, {$set: {exam_status: 'taken', "time_stamp.stop": new Date().toLocaleString(),time_left: request.body.secondsLeft}}, {})
  answers_db.update({_id: _id}, {$set: {answers: request.body.answers}}, {})
  console.log(`Exam submitted successfully. _id:${_id}. Time: ${new Date().toLocaleString()}`)

  response.send({status: "OK"})
})
module.exports = student