
var mysql = require("mysql2");
// var mysql = require("mysql") ;
var con = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"pawar@@12345",
    database:"information"
})

con.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
  
    console.log('connected as id ' + con.threadId);
  });

  module.exports = con;