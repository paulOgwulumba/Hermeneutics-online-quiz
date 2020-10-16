//Exam status can either be 'not taken', 'in session' or 'taken'

const { response } = require('express');
const express = require('express');
const session = require('express-session');
const { request } = require('http');
const admin = express.Router()
const path = require('path')
require('dotenv').config({path: path.join(__dirname, '..', '.env')});
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

//crypto module for hashing strings
const SHA256 = require('crypto-js/sha256');

const Datastore = require('nedb');

const student_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'student_base.db'), autoload: true},)
const answers_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'answers_base.db'), autoload: true})
const session_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'session_base.db'), autoload: true})

//set up session middleware
admin.use(session({secret: "jets", saveUninitialized: true, resave: true}))
//admin.use(bodyParser.urlencoded({extended: true}));
//admin.use(cookieParser())
//variable to track sessions with
var sessionID;

/*
  GET REQUESTS
*/
//checks if session is open, if it is not, a redirect is triggered
admin.get('/session', (request, response) => {
  if(sessionID === request.session.id){
    response.send({status: "OK"})
  }
  else{
    response.send({status: "FAILED"})
  }
})

//cancels present session and redirect to log in page is triggered
admin.get('/log-out', (request, response) => {
  request.session.destroy( error => {
    if(error){
      console.error(error)
      console.log(`Admin log out failed. Time: ${new Date().toLocaleString()}`)
      response.send({status: "FAILED"})
    }
    console.log(`Successful Admin log out confirmed. Time: ${new Date().toLocaleString()}`)
    response.send({status: "OK"})
  })
})

//Sends the personal information of a student to the clientside
admin.get('/student/:id', (request, response) => {
  let _id = request.params.id;
  try{
    student_db.findOne({_id: _id}, (error, document) => {
      if(error) throw error;
      if(document !== null & document !== undefined){
        console.log(`Student information sent to clientside. Time: ${new Date().toLocaleString()}`);
        response.send(document)
      }
      else{
        console.log(`Student information attempted to be extracted from database but failed because no information matching given ID was found. Time: ${new Date().toLocaleString()}`);
        response.status(404).send({status: "FAILED"})
      }
    })
  }
  catch(error){
    console.log(`Student information attempted to be extracted from database but failed because of database error. Time: ${new Date().toLocaleString()}`);
    console.error(error)
    response.status(404).send({status: "FAILED"})
  }
})

//Sends the class list to the clientside
admin.get('/students', (request, response) => {
  try{
    student_db.find({}, (error, document)=> {
      if(error) throw error;
      console.log(`Student info sent to clientside. Time: ${new Date().toLocaleString()}`)
      response.send(document)
    })
  }
  catch(error){
    console.error(error)
  }
})

//sends a student's exam session state to the clientside
admin.get('/student/session/:id', (request, response) => {
  let _id = request.params.id;
  try{
    session_db.findOne({_id: _id}, (error, document) => {
      if(error) throw error
      if(document !== null & document !== undefined){
        console.log(`Student exam session info sent to clientside. Time: ${new Date().toLocaleString()}`);
        response.send(document)
      }
      else{
        console.log(`Student exam session info attempted to be extracted from database but failed because no information matching given ID was found. Time: ${new Date().toLocaleString()}`);
        response.status(404).send({status: "FAILED"})
      }
    })
  }
  catch(error){
    console.log(`Student exam session info attempted to be extracted from database but failed because of database error. Time: ${new Date().toLocaleString()}`);
    console.error(error)
    response.status(404).send({status: "FAILED"})
  }
})

//sends a student's exam answer sheet to the clientside
admin.get('/student/answer-sheet/:id', (request, response) => {
  let _id = request.params.id;
  try{
    answers_db.findOne({_id: _id}, (error, document) => {
      if(error) throw error
      if(document !== null & document !== undefined){
        console.log(`Student answer sheet sent to clientside. Time: ${new Date().toLocaleString()}`);
        response.send(document)
      }
      else{
        console.log(`Student answer sheet attempted to be extracted from database but failed because no information matching given ID was found. Time: ${new Date().toLocaleString()}`);
        response.status(404).send({status: "FAILED"})
      }
    })
  }
  catch(error){
    console.log(`Student answer sheet attempted to be extracted from database but failed because of database error. Time: ${new Date().toLocaleString()}`);
    console.error(error)
    response.status(404).send({status: "FAILED"})
  }
})

/*
  POST REQUESTS
*/
//validates the log in entries for the admin page
admin.post('/log-in', (request, response) => {
  if(request.body.username === process.env.ADMIN_USERNAME && request.body.password === process.env.ADMIN_PASSWORD){
    console.log(`Successful Admin log in confirmed. Time: ${new Date().toLocaleString()}`)
    //creates a new session to be tracked
    sessionID = request.session.id
    response.send({status: "OK"})
  }
  else{
    console.log(`Failed Admin log in. Time: ${new Date().toLocaleString()}`)
    response.send({status: "FAILED"})
  }
})

//Adds student info to the student database
admin.post('/student', (request, response) => {
  let obj = request.body;
  let objKeys = Object.keys(obj)
  
  //string to be hashed to form student unique password
  let toBeHashed = ""
  let nameArray = obj.name.split(' ')
  for(let name of nameArray){
    toBeHashed = toBeHashed + name.substr(0, 2);
  }
  toBeHashed = toBeHashed + obj.student_id.substr(0, 2);
  toBeHashed = toBeHashed + obj.email.substr(0, 2);
  toBeHashed = toBeHashed + obj.mobile_number.substr(0, 2);

  obj.password = SHA256(toBeHashed).toString().substr(0, 10);

  //Checks for any empty field
  for(let key of objKeys){
    if(obj[key] === ""){
      console.log(`New student attempted to be added to database but failed due to empty field. Time: ${new Date().toLocaleString()}`)
      response.send({status: "FAILED"})
    }
  }

  try{
    student_db.insert(obj, (error, document) => {
      if(error) throw error;
      console.log(`New student added to student database. Time: ${new Date().toLocaleString()}`)
      
      //object to be added to answers database
      let object = {_id: document._id, answers: {}}

      //object to hold answers to all the questions
      for(let i=1; i<=99; i++){
        let answer =  "blank"
        object.answers["question-" + i] = answer;
      }

      //answers database is updated 
      answers_db.insert(object, (error, doc) => {
        //if an error occurs while creating answer database, delete student info from student database
        if(error){
          console.log(`Student answers object failed to be added to answers database due to database error. Time: ${new Date().toLocaleString()}`)
          student_db.remove({_id: document._id}, {}, (error, number) => {
            if(error) throw error
            console.log(`${number} student info deleted successfully to revert answer database error. Time: ${new Date().toLocaleString()}`);
          })
          throw error
        }
        console.log(`New student answer database created successfully. Time: ${new Date().toLocaleString()}`)
      })

      //session object for student
      let session_database = {
        exam_status: "not taken",         //value can either be 'not taken', 'in session' or 'taken'
        time_left: 7200,
        _id: document._id,
        time_stamp: {
          start: "",
          stop: ""
        }
      }

      session_db.insert(session_database, (error, docs) => {
        if(error) throw error
        console.log(`New student exam session database created successfully. Time: ${new Date().toLocaleString()}`)
      })

      response.send({status: "OK"})
    })

  }
  catch(e){
    console.error(e)
    response.send({status: "FAILED"})
  }
})


/*
  DELETE REQUESTS
*/
//deletes a student's info from the database
admin.delete('/student', (request, response) => {
  try{
    //delete student personal info
    student_db.remove({_id: request.body._id}, {}, (error, number) => {
      if(error) throw error
      console.log(`${number} student personal info deleted successfully. Time: ${new Date().toLocaleString()}`)
    })

    //delete student answer sheet
    answers_db.remove({_id: request.body._id}, {}, (error, number) => {
      if(error) throw error
      console.log(`${number} student answer-sheet info deleted successfully. Time: ${new Date().toLocaleString()}`)
    })

    //delete student exam session state
    session_db.remove({_id: request.body._id}, {}, (error, number) => {
      if(error) throw error;
      console.log(`${number} student exam session state deleted successfully. Time: ${new Date().toLocaleString()}`)
    })
    response.send({status: "OK"})
  }
  catch(error){
    console.error(error)
    response.send({status: "FAILED"})
  }
})

module.exports = admin
