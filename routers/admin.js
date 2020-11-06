//Exam status can either be 'not taken', 'in session' or 'taken'

//set up express object and its dependencies
const { response } = require('express');
const express = require('express');
const session = require('express-session');
const { request } = require('http');
const admin = express.Router()
const path = require('path')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

require('dotenv').config({path: path.join(__dirname, '..', '.env')});
admin.use(cookieParser())
//include file reader/writer
const fs = require('fs');

//crypto module for hashing strings
const SHA256 = require('crypto-js/sha256');

//create database objects
var student_db, answers_db, session_db, session_tracker_db, admin_session_db;


//set up database
var {Client} = require('../utils/utils');
const { ObjectID, ObjectId } = require('mongodb');
//connect to database
Client.connect(err => {
  if(err) throw err
  student_db = Client.db().collection('student_base');
  answers_db = Client.db().collection('answers_base');
  session_db = Client.db().collection('session_base');
  session_tracker_db = Client.db().collection('session_tracker_base');
  admin_session_db = Client.db().collection('admin_session_base')
})



//Include nodemailer for sending emails
const nodemailer = require('nodemailer');
const { getMaxListeners } = require('process');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    secure: true,
    auth: {
        user: process.env.FROM_MAIL,
        pass: process.env.PASSWORD
    }
})

//Include mailgen for styling email
const Mailgen = require('mailgen');
const mailGenerator = new Mailgen({
    theme: 'cerberus',
    product: {
        name: 'Jos, ECWA Theological Seminary',
        link: 'http://www.jets.edu.ng'
    }
})

//set up session middleware
admin.use(session({secret: "jets", saveUninitialized: true, resave: true}))
//admin.use(bodyParser.urlencoded({extended: true}));
//admin.use(cookieParser())
//variable to track sessions with
var sessionID = "0";

/*
*  GET REQUESTS
*/
//checks if session is open, if it is not, a redirect is triggered
admin.get('/session', async (request, response) => {
  let AdminToken;
  
  try{
    AdminToken = request.cookies["AdminToken"];
  }
  catch(error){}

  let session = await admin_session_db.findOne({sessionID: AdminToken})

  if(session !== null && session !== undefined){
    response.send({status: "OK"})
  }
  else{
    console.log(`Admin session cancelled because admin is not logged in. Time: ${new Date().toLocaleString()}`)
    response.send({status: "FAILED"})
  }
})

//cancels present session and redirect to log in page is triggered
admin.get('/log-out', async (request, response) => {
  request.session.destroy(async error => {
    if(error){
      console.error(error)
      console.log(`Admin log out failed. Time: ${new Date().toLocaleString()}`)
      response.send({status: "FAILED"})
    }
    await admin_session_db.deleteMany({});
    console.log(`Successful Admin log out confirmed. Time: ${new Date().toLocaleString()}`)
    sessionID = "0"
    response.send({status: "OK"})
  })
})

//Sends the personal information of a student to the clientside
admin.get('/student/:id', async (request, response) => {
  let _id = request.params.id;
  try{
    let document = await student_db.findOne({_id: ObjectId(_id)})
    if(document !== null & document !== undefined){
      console.log(`Student information sent to clientside. Time: ${new Date().toLocaleString()}`);
      response.send(document)
    }
    else{
      console.log(`Student information attempted to be extracted from database but failed because no information matching given ID was found. Time: ${new Date().toLocaleString()}`);
      response.status(404).send({status: "FAILED"})
    }
  }
  catch(error){
    console.log(`Student information attempted to be extracted from database but failed because of database error. Time: ${new Date().toLocaleString()}`);
    console.error(error)
    response.status(404).send({status: "FAILED"})
  }
})

//Sends the class list to the clientside
admin.get('/students', async (request, response) => {
  try{
    let document = await student_db.find().toArray()
    console.log(`Student info sent to clientside. Time: ${new Date().toLocaleString()}`)
    response.send(document)
  }
  catch(error){
    console.error(error)
  }
})

//sends a student's exam session state to the clientside
admin.get('/student/session/:id', async (request, response) => {
  let _id = request.params.id;
  try{
    let document = await session_db.findOne({_id: ObjectId(_id)});
    if(document !== null & document !== undefined){
      console.log(`Student exam session info sent to clientside. Time: ${new Date().toLocaleString()}`);
      response.send(document)
    }
    else{
      console.log(`Student exam session info attempted to be extracted from database but failed because no information matching given ID was found. Time: ${new Date().toLocaleString()}`);
      response.status(404).send({status: "FAILED"})
    }
  }
  catch(error){
    console.log(`Student exam session info attempted to be extracted from database but failed because of database error. Time: ${new Date().toLocaleString()}`);
    console.error(error)
    response.status(404).send({status: "FAILED"})
  }
})

//sends a student's exam answer sheet to the clientside
admin.get('/student/answer-sheet/:id', async (request, response) => {
  let _id = request.params.id;
  try{
    let document = await answers_db.findOne({_id: ObjectId(_id)});
    if(document !== null & document !== undefined){
      console.log(`Student answer sheet sent to clientside. Time: ${new Date().toLocaleString()}`);
      response.send(document)
    }
    else{
      console.log(`Student answer sheet attempted to be extracted from database but failed because no information matching given ID was found. Time: ${new Date().toLocaleString()}`);
      response.status(404).send({status: "FAILED"})
    }
  }
  catch(error){
    console.log(`Student answer sheet attempted to be extracted from database but failed because of database error. Time: ${new Date().toLocaleString()}`);
    console.error(error)
    response.status(404).send({status: "FAILED"})
  }
})

//sends an email containing student username, password and exam link to student's email address
admin.get('/student/send-email/:id', async (request, response) => {
  let _id = request.params.id
  try{
    let doc = await student_db.findOne({_id: ObjectId(_id)});
    if(doc !== null && doc!==undefined){
      sendEmail(doc)
      response.send({status: "OK"})
    }
  }
  catch(e){
    console.log(`Failed to send email to Student ID: ${_id} due to database error. Time: ${new Date().toLocaleString()}`)
    response.send({status: "FAILED"})
  }

})

/*
*  POST REQUESTS
*/
//validates the log in entries for the admin page
admin.post('/log-in', async (request, response) => {
  if(request.body.username === process.env.ADMIN_USERNAME && request.body.password === process.env.ADMIN_PASSWORD){
    console.log(`Successful Admin log in confirmed. Time: ${new Date().toLocaleString()}`)
    //creates a new session to be tracked
    sessionID = request.session.id;
    await admin_session_db.deleteMany({});
    await admin_session_db.insertOne({sessionID})
    response.cookie("AdminToken", sessionID)
    response.send({status: "OK"})
  }
  else{
    console.log(`Failed Admin log in. Time: ${new Date().toLocaleString()}`)
    response.send({status: "FAILED"})
  }
})

//Adds student info to the student database
admin.post('/student', async (request, response) => {
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

  //makes sure no already registered student has the same email address or student id
  
  try{
    let documents = await student_db.find().toArray()
    let go = true           //if true, student is added to the database
    trial: for(let doc of documents){
      if(doc.student_id === obj.student_id){
        console.log(`Attempt to add new student failed because student ID already exists. Time: ${new Date().toLocaleString()}`)
        response.send({status: "ID"})
        go = false;
        break trial;
      }
      else if(doc.email === obj.email){
        console.log(`Attempt to add new student failed because student email already exists. Time: ${new Date().toLocaleString()}`)
        response.send({status: "EMAIL"})
        go = false;
        break trial;
      }
    }

    if(go){
      //add student to database
      try{
        let document = await student_db.insertOne(obj);
        
        console.log(`New student added to student database. Time: ${new Date().toLocaleString()}`)
        //object to be added to answers database
        let object = {_id: document.insertedId, answers: {}}

        //object to hold answers to all the questions
        for(let i=1; i<=99; i++){
          let answer =  "blank"
          object.answers["question-" + i] = answer;
        }
        
        //answers database is updated 
        await answers_db.insertOne(object).catch(error => {
          //if an error occurs while creating answer database, delete student info from student database
          console.log(`Student answers object failed to be added to answers database due to database error. Time: ${new Date().toLocaleString()}`)
          student_db.deleteOne({_id: ObjectId(document.insertedId)})
          console.log(`${number} student info deleted successfully to revert answer database error. Time: ${new Date().toLocaleString()}`);
          throw error
        })
        
        console.log(`New student answer database created successfully. Time: ${new Date().toLocaleString()}`)
    

        //session object for student
        let session_database = {
          exam_status: "not taken",         //value can either be 'not taken', 'in session' or 'taken'
          time_left: 5400,
          _id: document.insertedId,
          time_stamp: {
            start: "",
            stop: "",
            start_uts: "",
            stop_uts: ""
          },
          current_question: 0
        }

        await session_db.insertOne(session_database).catch(error => {
          //if an error occurs while creating answer database, delete student info from student database
          console.log(`Student session object failed to be added to answers database due to database error. Time: ${new Date().toLocaleString()}`)
          student_db.deleteOne({_id: ObjectId(document.insertedId)})
          answers_db.deleteOne({_id: ObjectId(document.insertedId)})
          console.log(`Student info and answer sheet deleted successfully to revert session database error. Time: ${new Date().toLocaleString()}`);
          throw error
        })
        console.log(`New student exam session database created successfully. Time: ${new Date().toLocaleString()}`)

        response.send({status: "OK"})

      }
      catch(e){
        console.log(`New student attempted to be added but failed because of database error. Time: ${new Date().toLocaleString()}\n.${e}`)
        response.send({status: "FAILED"})
      }
    }
    
  }
  catch(e){
    console.log(`New student attempted to be added but failed because of database error. Time: ${new Date().toLocaleString()}\n.${e}`)
    response.send({status: "FAILED"})
  }

})


/*
*  DELETE REQUESTS
*/
//deletes a student's info from the database
admin.delete('/student', (request, response) => {
  let _id = request.body._id;
  let number = 1;
  try{
    //delete student personal info
    student_db.deleteOne({_id: ObjectId(_id)});
    console.log(`${number} student personal info deleted successfully. Time: ${new Date().toLocaleString()}`)

    //delete student answer sheet
    answers_db.deleteOne({_id: ObjectId(_id)})
    console.log(`${number} student answer-sheet info deleted successfully. Time: ${new Date().toLocaleString()}`)

    //delete student exam session state
    session_db.deleteOne({_id: ObjectId(_id)})
    console.log(`${number} student exam session state deleted successfully. Time: ${new Date().toLocaleString()}`)

    //delete student exam session tracker database object
    session_tracker_db.deleteOne({_id: ObjectId(_id)})
    console.log(`${number} student exam session tracker object deleted successfully. Time: ${new Date().toLocaleString()}`)

    response.send({status: "OK"})
  }
  catch(error){
    console.error(error)
    response.send({status: "FAILED"})
  }
})

//generates and sends email to student
function sendEmail(doc = {
  name: "",
  email: "",
  student_id: "",
  password: "",
  _id: ""
}){
  //set up  body of email to be sent
  let email = {
    body: {
      greeting: "Hi",
      name: doc.name,
      intro: [
        'Calvary greetings to you in Jesus\' name.',
        `These are your log in details for the Hermeneutics I online quiz. Keep them safe.`,
        `USER ID: ${doc.student_id}`,
        `PASSWORD: ${doc.password}`,
        `It is of importance that you use a computer and not a phone to write this quiz, preferably with a chrome browser.`
      ],
      action: [
          {
            instructions: `To get started with the quiz, please click here.`,
            button: {
              
              text: "Go to exam log in page.",
              link: `http://hermeneutics-online-quiz.herokuapp.com/index.html?${doc._id}`
            }
          }
        ],
        outro: [
          `You can also copy this link and paste on your browser to get started:`,
          `http://hermeneutics-online-quiz.herokuapp.com/index.html?${doc._id}`
        ]
      }
  }

  //Generate a HTML email with the provided contents
  let emailBody = mailGenerator.generate(email)

  //preview generated email
  // fs.writeFileSync(path.join(__dirname, 'email-preview', `preview-${doc.name}.html`), emailBody, 'utf8');
  // console.log(`Preview email body for ${doc.name} generated successfully. Time: ${new Date().toLocaleString()}`)

  //mail is sent 
  let mailOptions = {
    from: process.env.FROM_MAIL,
    to: doc.email,
    subject: "Hermeneutics I - Online Quiz",
    html: emailBody
  }
  transporter.sendMail(mailOptions, (error, response)=>{
    if(error) {
        console.log(`Error sending email to ${doc.name} through the address (${doc.email}). Time: ${new Date().toLocaleString()}`)
        console.log(error)
    } 
    else{
      //Update database to signify that student has received email
      student_db.updateOne({_id: ObjectId(doc._id)}, {$set: {email_status: "sent"}}, {})
      console.log(`Email sent to ${doc.name} through the address (${doc.email}). Time: ${new Date().toLocaleString()}`)
      //console.log(response)
    }
  })

}


module.exports = admin
