
// WEB APP SETUP

const http = require('http');
const chalk = require('chalk')
const express = require('express')
const ejs = require('ejs');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const app = express();

//connect to MongoDB
mongoose.connect('mongodb://localhost:27001/mydb');
var db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!
  console.log(chalk.green('DB connected.'))
});

//use sessions for tracking logins
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  }),
}));

const hostname = '127.0.0.1'
const port = 3000;


const args = require('minimist')(process.argv.slice(2))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var routes = require('./routes/router');
app.use('/', routes);
/////////////////////////////////////////////////////////////////////

// app.get('/', (req, res) => {
//   res.render('index', {args: req.params});
// });

// app.put('/teacherlogin', (req, res) => {
// 	if (req.body.email && req.body.first && req.body.last
// 	  req.body.username && req.body.password &&
// 	  req.body.passwordConf) {  

// 		var tData = {
// 	    email: req.body.email,
// 	    username: req.body.username,
// 	    password: req.body.password,
// 	  }  //use schema.create to insert data into the db
// 	  Teacher.create(tData, function (err, user) {
// 	    if (err) {
// 	      return next(err)
// 	    } else {
// 	      return res.redirect('/profile');
// 	    }
// 	  });
// 	}
// });

// app.get('/teacherdashboard/:teacherId', (req, res) => {
// 	res.render('teacherdash', {args: req.params});
// });

app.use('/static', express.static('static'))


app.listen(port, () => {
	console.log(`Server running at http://${hostname}:${port}/`)

});

// MONGO SETUP

// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb://localhost:27001/mydb";

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   console.log("Database created!");
//   var dbo = db.db("schooltrust")
//   var first = { fname: "Jerry", lname: "Smith", received: 100, target:500 };
//   dbo.collection("teachers").insertOne(first, function(err, res) {
//   	if (err) throw err;
//   	console.log("Inserted Teacher 1.");
//   	db.close();
//   });
// });