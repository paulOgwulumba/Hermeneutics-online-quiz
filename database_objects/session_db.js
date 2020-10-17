const Datastore = require('nedb');
const path = require('path')

const session_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'session_base.db'), autoload: true});

module.exports = session_db;