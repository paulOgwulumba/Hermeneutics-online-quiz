//Exam status can either be 'not taken', 'in session' or 'taken'

const { response } = require('express');
const express = require('express');
const { request } = require('http');
const admin = express.Router()
const path = require('path')
require('dotenv').config({path: path.join(__dirname, '..', '.env')});

const Datastore = require('nedb');

const student_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'student_base.db'), autoload: true},)
const answers_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'answers_base.db'), autoload: true})
const session_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'session_base.db'), autoload: true})

//validates the log in entries for the admin page
admin.post('/log-in', (request, response) => {
  if(request.body.username === process.env.ADMIN_USERNAME && request.body.password === process.env.ADMIN_PASSWORD){
    console.log(`Successful Admin log in confirmed. Time: ${new Date().toLocaleString()}`)
    response.send({status: "OK"})
  }
  else{
    console.log(`Failed Admin log. Time: ${new Date().toLocaleString()}`)
    response.send({status: "FAILED"})
  }
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

//Adds student info to the student database
admin.post('/student', (request, response) => {
  let obj = request.body;
  let objKeys = Object.keys(obj)

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
      let object = {_id: document._id}

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
        console.log(`New student answer database created successfully. Time: ${new Date().toLocaleString()}`)
      })

      response.send({status: "OK"})
    })

  }
  catch(e){
    console.error(e)
    response.send({status: "FAILED"})
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

//deletes a student's info from the database
admin.delete('/student', (request, response) => {
  try{
    student_db.remove({_id: request.body._id}, {}, (error, number) => {
      if(error) throw error
      console.log(`${number} student info deleted successfully. Time: ${new Date().toLocaleString()}`)
      response.send({status: "OK"})
    })
    
  }
  catch(error){
    console.error(error)
    response.send({status: "FAILED"})
  }
})

module.exports = admin
