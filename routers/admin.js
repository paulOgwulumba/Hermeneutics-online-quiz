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
    console.log(`Successful Admin log in confirmed. Time: ${new Date().toLocaleString()}`)
    response.send({status: "OK"})
  }
  else{
    console.log(`Failed Admin log. Time: ${new Date().toLocaleString()}`)
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
      console.log(`New student attempted to be added to database but failed due to empty field. Time: ${new Date().toLocaleString()}`)
      response.send({status: "FAILED"})
    }
  }

  try{
    student_db.insert(obj, (error, document) => {
      if(error) throw error;
      console.log(`New student added to database. Time: ${new Date().toLocaleString()}`)
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
