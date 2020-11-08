const express = require('express');
const session = require('express-session');
const { request } = require('http');
const student = express.Router()
const path = require('path')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

student.use(cookieParser())
//create database objects
var student_db, answers_db, session_db, session_tracker_db;

//set up database
var {Client} = require('../utils/utils');
const { ObjectId } = require('mongodb');
//connect to database
Client.connect(err => {
  if(err) throw err
  //stores student information
  student_db = Client.db().collection('student_base');
  //stores the answer sheet of students
  answers_db = Client.db().collection('answers_base');
  //stores information about the exams taken by the student
  session_db = Client.db().collection('session_base');
  //keeps track of all the student sessions to make sure that no single student has two sessions running simultaneously
  session_tracker_db = Client.db().collection('session_tracker_base');
})

//set up session middleware
student.use(session({secret: "jets", saveUninitialized: true, resave: true}));
student.use(bodyParser.urlencoded({extended: true}));
student.use(cookieParser());

//this appends a user and _id object unique to the session id to any incoming request
student.use(async (request, response, next) => {
  //Get auth token from cookies
  let authToken = request.cookies["AuthToken"];

  //sorts through the session tracker database to see what user is attached to authToken
  try{
    let document = await session_tracker_db.findOne({session_id: authToken})
    //if a match is found, append the name of the student to the request and pass it on
    if(document !== null && document !== undefined){
      request.user = document.name;
      request._id = document._id;
    }
    next()
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
student.post('/log-in', async (request, response) => {
  let user = request.body;
  try{
    //checks for empty username and/or password
    if(user.student_id === "" || user.password === ""){
      console.log(`Failed log in attempt to exam portal by empty Student ID or password: ${user.student_id}. Time: ${new Date().toLocaleString()}`)
      response.send({status: "Please enter your ID Number and password"});
      response.end()
    }
    else{
      let document = await student_db.findOne({student_id: user.student_id});
      //checks for invalid student id
      if(document == null || document == undefined){
        console.log(`Failed log in attempt to exam portal by invalid Student ID: ${user.student_id}. Time: ${new Date().toLocaleString()}`)
        response.send({status: "Invalid student ID"});
      }
      else{
        //correct username and password
        if(document.password === user.password){
          console.log(`Successfull log in to exam portal by Student ID: ${user.student_id}. Time: ${new Date().toLocaleString()}`)
          
          //set cookie
          response.cookie("AuthToken", request.session.id);

          //delete former instances of session tracker if any
          await session_tracker_db.deleteMany({name: document.name, _id: document._id});
          await session_tracker_db.insertOne({name: document.name, _id: document._id, session_id: request.session.id})
          
          response.send({status: "OK", _id: document._id})
        }
        else{
            console.log(`Failed log in attempt to exam portal by Student ID: ${user.student_id} due to wrong password. Time: ${new Date().toLocaleString()}`)
            response.send({status: "Incorrect password"})
        }
      }
  
    }
  }
  catch(error){
    console.error(error)
    console.log(`Attempted log in to exam portal by Student ID: ${user.student_id} failed due to database error. Time: ${new Date().toLocaleString()}`)
    response.status(404).send({status: "Server error!"})
  }
})

//checks if the student is logged in or not
student.get('/session', requireAuth, async (request, response) => {
  let _id = request._id;
  try{
    let document = await session_db.findOne({_id: ObjectId(_id)});
    //exam not already in session approve start of exam
    if(document.exam_status === 'not taken'){
      console.log(`Student (${request.user}) exam initializing attempt approved. Time: ${new Date().toLocaleString()} `);
      response.send({status: "OK"})
    }
    //exam in session, approve continuation of exam
    else if(document.exam_status === 'in session'){
      let doc = await answers_db.findOne({_id: ObjectId(_id)})
      console.log(`Student (${request.user}) exam continuation attempt approved. Time: ${new Date().toLocaleString()} `);
      response.send({status: "CONTINUE", session: document, answers: doc.answers});
    }
    //exam session already ended, disapprove
    else{
      console.log(`Student (${request.user}) exam initialization attempt blocked because he/she already took the exam. Time: ${new Date().toLocaleString()} `);
      response.send({status: "TAKEN"})
    }
  }
  catch(error){
    console.error(error)
    console.log(`Student (${request.user}) exam starting attempt blocked because of database error while fetching exam session state. Time: ${new Date().toLocaleString()} `);
    response.send({status: "LOG OUT"})
  }
})

//checks if multiple people logged into one student account or not
student.get('/login-status', requireAuth, async (request, response) => {
  let name = request.user;
  try{
    //checks if log-in info of this user matches what is in the database already
    let document = await session_tracker_db.findOne({name: name, session_id: request.cookies['AuthToken']});

    if(document == null || document == undefined){
      console.log(`Checked log in status for ${name} with session AuthToken: ${request.cookies['AuthToken']}. Status failed, second-party already logged into account. Time: ${new Date().toLocaleString()}`)
      response.send({status: "FAILED"});
    }
    else{
      console.log(`Checked log in status for ${name} session AuthToken: ${request.cookies['AuthToken']}. Status is okay, no second-party logged into same account. Time: ${new Date().toLocaleString()}`)
      response.send({status: "OK"});
    }
  }
  catch(err){
    console.error(error)
    response.send({status: "FAILED"})
  }
})

//starts the exam and creates a timeout that terminates the exam after time limit window is passed
student.get('/start-exam', async (request, response) => {
  //gets database id attached to request
  let _id = request._id;

  //checks if student already took the exam
  let doc = await session_db.findOne({_id: ObjectId(_id)})
  if(doc.exam_status === "taken"){
    console.log(`Student exam start-exam attempt blocked because exam portal is closed. Time: ${new Date().toLocaleString()}`)
    response.send({status: "FAILED"});
  }
  else{
    try{
      //updates exam session information
      session_db.updateOne({ _id: ObjectId(_id) }, { $set: {exam_status: 'in session', "time_stamp.start": new Date().toLocaleString(), "time_stamp.start_uts": new Date().getTime()/1000}}, {});
      console.log(`Student exam session started successfully. _id: ${_id}. Time: ${new Date().toLocaleString()}`)
      
      //makes sure the exam session automatically ends at exactly 10:35 am, 24th November if student does not end the exam
      let time_stamp_milliseconds = new Date(2020, 10, 24, 10, 35).getTime() - new Date().getTime()
      setTimeout(async () => {
        //get session information from database
        let document = await session_db.findOne({_id: ObjectId(_id)})

        //check if exam has been submitted already and submit it if it hasn't
        if(document.exam_status !== 'taken'){
          session_db.updateOne({ _id: ObjectId(_id) }, { $set: {exam_status: 'taken', "time_stamp.stop": new Date().toLocaleString(), "time_stamp.stop_uts": new Date().getTime() / 1000} }, {})
          console.log(`Exam forcefully submitted because 24th Nov 10:35am has been exceeded. _id:${_id}. Time: ${new Date().toLocaleString()}`)
        }
      }, time_stamp_milliseconds);
      
      response.send({status: "OK"});
    }
    catch(error){
      console.log(`Database error while trying to start student exam. id: ${_id}. Time: ${new Date().toLocaleString()}`);
      console.error(error);
      response.status(404).send({status: "FAILED"});
    }
  }
})

//adds answers to the database
student.post('/exam', requireAuth, async (request, response) => {
  let _id = request._id;

  try{
    //checks if the exam session is still open or not
    let doc = await session_db.findOne({_id: ObjectId(_id)})

    if(doc.exam_status === "taken"){
      response.send({status: "FAILED"})
    }
    else{
      session_db.updateOne({_id: ObjectId(_id)}, {$set: {current_question: request.body.current_question, time_left: request.body.secondsLeft}}, {})
      answers_db.updateOne({_id: ObjectId(_id)}, {$set: {answers: request.body.answers}}, {})
      console.log(`Student exam answers, current question and time left updated successfully. _id: ${_id}. Time: ${new Date().toLocaleString()}`)
      response.send({status: "OK"})
    }
  }
  catch(e){
    console.log(`Student exam answers, current question and time left failed to be updated. _id: ${_id}. Time: ${new Date().toLocaleString()}`)
    console.error(e)
    response.status(404).send({status: "FAILED"});
  }
})

//ends the exam
student.post('/stop-exam', requireAuth,(request, response) => {
  let _id = request._id;
  try{
    session_db.updateOne({_id: ObjectId(_id)}, {$set: {exam_status: 'taken', "time_stamp.stop": new Date().toLocaleString(), "time_stamp.stop_uts": new Date().getTime()/1000, time_left: request.body.secondsLeft}}, {})
    answers_db.updateOne({_id: ObjectId(_id)}, {$set: {answers: request.body.answers}}, {});
    console.log(`Exam submitted successfully. _id:${_id}. Time: ${new Date().toLocaleString()}`);

    response.send({status: "OK"});
  }
  catch(error){
    console.log(`Exam submission failed due to database error. _id:${_id}. Time: ${new Date().toLocaleString()}`);
    console.error(error);
    response.status(404).send({status: "FAILED"});
  }
})

module.exports = student