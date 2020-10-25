const Datastore = require('nedb');
const path = require('path')

const student_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'student_base.db'), autoload: true})

module.exports = student_db