const { response } = require('express');
const express = require('express');
const { request } = require('http');
const admin = express.Router()
const path = require('path')
require('dotenv').config({path: path.join(__dirname, '..', '.env')});

//validates the log in entries for the admin page
admin.post('/log-in', (request, response) => {
  if(request.body.username === process.env.ADMIN_USERNAME && request.body.password === process.env.ADMIN_PASSWORD){
    response.send({status: "OK"})
  }
  else{
    response.send({status: "FAILED"})
  }
})

module.exports = admin
