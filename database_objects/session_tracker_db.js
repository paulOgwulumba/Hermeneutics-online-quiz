const Datastore = require('nedb');
const path = require('path')

const session_tracker_db = new Datastore({filename: path.join(__dirname, '..', 'db', 'session_tracker_base.db'), autoload: true});

module.exports = session_tracker_db;