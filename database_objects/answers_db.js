const Datastore = require('nedb');
const path = require('path')

const answers_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'answers_base.db'), autoload: true})

module.exports = answers_db;