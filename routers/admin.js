//  Exam status can either be 'not taken', 'in session' or 'taken'

//  set up express object and its dependencies
const express = require('express')
const session = require('express-session')
const admin = express.Router()
const path = require('path')
const cookieParser = require('cookie-parser')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
admin.use(cookieParser())

//  crypto module for hashing strings
const SHA256 = require('crypto-js/sha256')

//  Create database objects
let studentDB, answersDB, sessionDB, sessionTrackerDB, adminSessionDB

//  Set up database
const { Client } = require('../utils/utils')
const { ObjectId } = require('mongodb')

//  Connect to database
Client.connect(err => {
  if (err) throw err
  studentDB = Client.db().collection('student_base')
  answersDB = Client.db().collection('answers_base')
  sessionDB = Client.db().collection('session_base')
  sessionTrackerDB = Client.db().collection('session_tracker_base')
  adminSessionDB = Client.db().collection('admin_session_base')
})

//  Include nodemailer for sending emails
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  secure: true,
  auth: {
    user: process.env.FROM_MAIL,
    pass: process.env.PASSWORD
  }
})

//  Include mailgen for styling email
const Mailgen = require('mailgen')
const mailGenerator = new Mailgen({
  theme: 'cerberus',
  product: {
    name: 'Jos, ECWA Theological Seminary',
    link: 'http://www.jets.edu.ng'
  }
})

//  Set up session middleware
admin.use(session({ secret: 'jets', saveUninitialized: true, resave: true }))

// Variable to track sessions with
let sessionID = '0'

/*
*  GET REQUESTS
*/
//  checks if session is open, if it is not, a redirect is triggered
admin.get('/session', async (request, response) => {
  let AdminToken
  try {
    AdminToken = request.cookies.AdminToken
  } catch (error) {}

  const session = await adminSessionDB.findOne({ sessionID: AdminToken })

  if (session !== null && session !== undefined) {
    response.send({ status: 'OK' })
  } else {
    console.log(`Admin session cancelled because admin is not logged in. Time: ${new Date().toLocaleString()}`)
    response.send({ status: 'FAILED' })
  }
})

// Cancels present session and redirect to log in page is triggered
admin.get('/log-out', async (request, response) => {
  request.session.destroy(async error => {
    if (error) {
      console.error(error)
      console.log(`Admin log out failed. Time: ${new Date().toLocaleString()}`)
      response.send({ status: 'FAILED' })
    }
    await adminSessionDB.deleteMany({})
    console.log(`Successful Admin log out confirmed. Time: ${new Date().toLocaleString()}`)
    sessionID = '0'
    response.send({ status: 'OK' })
  })
})

//  Sends the personal information of a student to the clientside
admin.get('/student/:id', async (request, response) => {
  const _id = request.params.id
  try {
    const document = await studentDB.findOne({ _id: ObjectId(_id) })
    if (document !== null & document !== undefined) {
      console.log(`Student information sent to clientside. Time: ${new Date().toLocaleString()}`)
      response.send(document)
    } else {
      console.log(`Student information attempted to be extracted from database but failed because no information matching given ID was found. Time: ${new Date().toLocaleString()}`)
      response.status(404).send({ status: 'FAILED' })
    }
  } catch (error) {
    console.log(`Student information attempted to be extracted from database but failed because of database error. Time: ${new Date().toLocaleString()}`)
    console.error(error)
    response.status(404).send({ status: 'FAILED' })
  }
})

//  Sends the class list to the clientside
admin.get('/students', async (request, response) => {
  try {
    const document = await studentDB.find().toArray()
    console.log(`Student info sent to clientside. Time: ${new Date().toLocaleString()}`)
    response.send(document)
  } catch (error) {
    console.error(error)
  }
})

// Sends a student's exam session state to the clientside
admin.get('/student/session/:id', async (request, response) => {
  const _id = request.params.id
  try {
    const document = await sessionDB.findOne({ _id: ObjectId(_id) })
    if (document !== null & document !== undefined) {
      console.log(`Student exam session info sent to clientside. Time: ${new Date().toLocaleString()}`)
      response.send(document)
    } else {
      console.log(`Student exam session info attempted to be extracted from database but failed because no information matching given ID was found. Time: ${new Date().toLocaleString()}`)
      response.status(404).send({ status: 'FAILED' })
    }
  } catch (error) {
    console.log(`Student exam session info attempted to be extracted from database but failed because of database error. Time: ${new Date().toLocaleString()}`)
    console.error(error)
    response.status(404).send({ status: 'FAILED' })
  }
})

// Sends a student's exam answer sheet to the clientside
admin.get('/student/answer-sheet/:id', async (request, response) => {
  const _id = request.params.id
  try {
    const document = await answersDB.findOne({ _id: ObjectId(_id) })
    if (document !== null & document !== undefined) {
      console.log(`Student answer sheet sent to clientside. Time: ${new Date().toLocaleString()}`)
      response.send(document)
    } else {
      console.log(`Student answer sheet attempted to be extracted from database but failed because no information matching given ID was found. Time: ${new Date().toLocaleString()}`)
      response.status(404).send({ status: 'FAILED' })
    }
  } catch (error) {
    console.log(`Student answer sheet attempted to be extracted from database but failed because of database error. Time: ${new Date().toLocaleString()}`)
    console.error(error)
    response.status(404).send({ status: 'FAILED' })
  }
})

//  Sends an email containing student username, password and exam link to student's email address
admin.get('/student/send-email/:id', async (request, response) => {
  const _id = request.params.id
  try {
    const doc = await studentDB.findOne({ _id: ObjectId(_id) })
    if (doc !== null && doc !== undefined) {
      sendEmail(doc)
      response.send({ status: 'OK' })
    }
  } catch (e) {
    console.log(`Failed to send email to Student ID: ${_id} due to database error. Time: ${new Date().toLocaleString()}`)
    response.send({ status: 'FAILED' })
  }
})

/*
*  POST REQUESTS
*/
//  Validates the log in entries for the admin page
admin.post('/log-in', async (request, response) => {
  if (request.body.username === process.env.ADMIN_USERNAME && request.body.password === process.env.ADMIN_PASSWORD) {
    console.log(`Successful Admin log in confirmed. Time: ${new Date().toLocaleString()}`)
    //  creates a new session to be tracked
    sessionID = request.session.id
    await adminSessionDB.deleteMany({})
    await adminSessionDB.insertOne({ sessionID })
    response.cookie('AdminToken', sessionID)
    response.send({ status: 'OK' })
  } else {
    console.log(`Failed Admin log in. Time: ${new Date().toLocaleString()}`)
    response.send({ status: 'FAILED' })
  }
})

//  Adds student info to the student database
admin.post('/student', async (request, response) => {
  const obj = request.body
  const objKeys = Object.keys(obj)
  //  String to be hashed to form student unique password
  let toBeHashed = ''
  const nameArray = obj.name.split(' ')
  for (const name of nameArray) {
    toBeHashed = toBeHashed + name.substr(0, 2)
  }
  toBeHashed = toBeHashed + obj.student_id.substr(0, 2)
  toBeHashed = toBeHashed + obj.email.substr(0, 2)
  toBeHashed = toBeHashed + obj.mobile_number.substr(0, 2)

  obj.password = SHA256(toBeHashed).toString().substr(0, 10)

  //  Checks for any empty field
  for (const key of objKeys) {
    if (obj[key] === '') {
      console.log(`New student attempted to be added to database but failed due to empty field. Time: ${new Date().toLocaleString()}`)
      response.send({ status: 'FAILED' })
    }
  }

  //  Makes sure no already registered student has the same email address or student id
  try {
    const documents = await studentDB.find().toArray()
    let go = true
    //  if true, student is added to the database
    for (const doc of documents) {
      if (doc.student_id === obj.student_id) {
        console.log(`Attempt to add new student failed because student ID already exists. Time: ${new Date().toLocaleString()}`)
        response.send({ status: 'ID' })
        go = false
        break
      } else if (doc.email === obj.email) {
        console.log(`Attempt to add new student failed because student email already exists. Time: ${new Date().toLocaleString()}`)
        response.send({ status: 'EMAIL' })
        go = false
        break
      }
    }

    if (go) {
      //  Add student to database
      try {
        const document = await studentDB.insertOne(obj)
        console.log(`New student added to student database. Time: ${new Date().toLocaleString()}`)

        //  Object to be added to answers database
        const object = { _id: document.insertedId, answers: {} }

        //  Object to hold answers to all the questions
        for (let i = 1; i <= 99; i++) {
          const answer = 'blank'
          object.answers['question-' + i] = answer
        }

        //  Answers database is updated
        await answersDB.insertOne(object).catch(error => {
          //  If an error occurs while creating answer database, delete student info from student database
          console.log(`Student answers object failed to be added to answers database due to database error. Time: ${new Date().toLocaleString()}`)
          studentDB.deleteOne({ _id: ObjectId(document.insertedId) })
          console.log(`1 student info deleted successfully to revert answer database error. Time: ${new Date().toLocaleString()}`)
          throw error
        })
        console.log(`New student answer database created successfully. Time: ${new Date().toLocaleString()}`)

        //  Session object for student
        const sessionDatabase = {
          //  Value of exam_status can either be 'not taken', 'in session' or 'taken'
          time_left: 5400,
          exam_status: 'not taken',
          _id: document.insertedId,
          time_stamp: {
            start: '',
            stop: '',
            start_uts: '',
            stop_uts: ''
          },
          current_question: 0
        }

        await sessionDB.insertOne(sessionDatabase).catch(error => {
          //  If an error occurs while creating answer database, delete student info from student database
          console.log(`Student session object failed to be added to answers database due to database error. Time: ${new Date().toLocaleString()}`)
          studentDB.deleteOne({ _id: ObjectId(document.insertedId) })
          answersDB.deleteOne({ _id: ObjectId(document.insertedId) })
          console.log(`Student info and answer sheet deleted successfully to revert session database error. Time: ${new Date().toLocaleString()}`)
          throw error
        })
        console.log(`New student exam session database created successfully. Time: ${new Date().toLocaleString()}`)

        response.send({ status: 'OK' })
      } catch (e) {
        console.log(`New student attempted to be added but failed because of database error. Time: ${new Date().toLocaleString()}\n.${e}`)
        response.send({ status: 'FAILED' })
      }
    }
  } catch (e) {
    console.log(`New student attempted to be added but failed because of database error. Time: ${new Date().toLocaleString()}\n.${e}`)
    response.send({ status: 'FAILED' })
  }
})

/*
*  DELETE REQUESTS
*/
//  Deletes a student's info from the database
admin.delete('/student', (request, response) => {
  const _id = request.body._id
  const number = 1
  try {
    // delete student personal info
    studentDB.deleteOne({ _id: ObjectId(_id) })
    console.log(`${number} student personal info deleted successfully. Time: ${new Date().toLocaleString()}`)

    // delete student answer sheet
    answersDB.deleteOne({ _id: ObjectId(_id) })
    console.log(`${number} student answer-sheet info deleted successfully. Time: ${new Date().toLocaleString()}`)

    //  delete student exam session state
    sessionDB.deleteOne({ _id: ObjectId(_id) })
    console.log(`${number} student exam session state deleted successfully. Time: ${new Date().toLocaleString()}`)

    //  delete student exam session tracker database object
    sessionTrackerDB.deleteOne({ _id: ObjectId(_id) })
    console.log(`${number} student exam session tracker object deleted successfully. Time: ${new Date().toLocaleString()}`)

    response.send({ status: 'OK' })
  } catch (error) {
    console.error(error)
    response.send({ status: 'FAILED' })
  }
})

// generates and sends email to student
/**
 * Generates an email tailored specifically to the details of student whose details are passed as argument to it and forwards
 * the email to said student's email address.
 * @param {*doc object containing name, email address, student id, password and database id of recipient of email
 */
function sendEmail (doc = {
  name: '',
  email: '',
  student_id: '',
  password: '',
  _id: ''
}) {
  // set up  body of email to be sent
  const email = {
    body: {
      greeting: 'Hi',
      name: doc.name,
      intro: [
        'Calvary greetings to you in Jesus\' name.',
        'These are your log in details for the Hermeneutics I online quiz. Keep them safe.',
        `USER ID: ${doc.student_id}`,
        `PASSWORD: ${doc.password}`,
        'It is of importance that you use a computer and not a phone to write this quiz, preferably with a chrome browser.'
      ],
      action: [
        {
          instructions: 'To get started with the quiz, please click here.',
          button: {
            text: 'Go to exam log in page.',
            link: `http://hermeneutics-online-quiz.herokuapp.com/index.html?${doc._id}`
          }
        }
      ],
      outro: [
        'You can also copy this link and paste on your browser to get started:',
        `http://hermeneutics-online-quiz.herokuapp.com/index.html?${doc._id}`
      ]
    }
  }

  //  Generate a HTML email with the provided contents
  const emailBody = mailGenerator.generate(email)

  //  Mail is sent
  const mailOptions = {
    from: process.env.FROM_MAIL,
    to: doc.email,
    subject: 'Hermeneutics I - Online Quiz',
    html: emailBody
  }

  transporter.sendMail(mailOptions, (error, response) => {
    if (error) {
      console.log(`Error sending email to ${doc.name} through the address (${doc.email}). Time: ${new Date().toLocaleString()}`)
      console.log(error)
    } else {
      //  Update database to signify that student has received email
      studentDB.updateOne({ _id: ObjectId(doc._id) }, { $set: { email_status: 'sent' } }, {})
      console.log(`Email sent to ${doc.name} through the address (${doc.email}). Time: ${new Date().toLocaleString()}`)
    }
  })
}

module.exports = admin
