const { response } = require('express');
const express = require('express');
const { request } = require('http');
const admin = express.Router()
const path = require('path')
require('dotenv').config({path: path.join(__dirname, '..', '.env')});

const Datastore = require('nedb');

const student_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'student_base.db'), autoload: true},)

//validates the log in entries for the admin page
admin.post('/log-in', (request, response) => {
  if(request.body.username === process.env.ADMIN_USERNAME && request.body.password === process.env.ADMIN_PASSWORD){
    response.send({status: "OK"})
  }
  else{
    response.send({status: "FAILED"})
  }
})

//Adds student info to the student database
admin.post('/student', (request, response) => {
  let obj = request.body;
  let objKeys = Object.keys(obj)

  //Checks for any empty field
  for(let key of objKeys){
    if(obj[key] === ""){
      response.send({status: "FAILED"})
    }
  }

  try{
    student_db.insert(obj, (error, document) => {
      if(error) throw error;
      response.send({status: "OK"})
    })
  }
  catch(e){
    response.send({status: "FAILED"})
  }
})

//Sends the class list to the clientside
admin.get('/students', (request, response) => {
  student_db.find({}, (error, document)=> {
    if(error) throw error;

    response.send(document)
  })
})

//deletes a student's info from the database
admin.delete('/student', (request, response) => {
  response.send({status: "OK"})
})

module.exports = admin
