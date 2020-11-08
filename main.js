//  Import express object
const express = require('express')
const session = require('express-session')

//  Import routers
const adminRouter = require('./routers/admin')
const studentRouter = require('./routers/student')

//  Set up tools
const path = require('path')

//  Initialise environment variables
require('dotenv').config({ path: path.join(__dirname, '/.env') })

//  Initialise express object
const server = express()

//  Set up server
server.use(express.json({ limit: '2mb' }))
server.use(express.static('public'))
server.use('/admin', adminRouter)
server.use('/student', studentRouter)
server.use(session({ secret: 'jets', saveUninitialized: true, resave: true }))

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`)
})
