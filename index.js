
// WEB APP SETUP

const http = require('http');
const chalk = require('chalk')
const express = require('express')
const ejs = require('ejs');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
require('dotenv').config({path: __dirname + '/.env'})

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


app.use('/static', express.static('static'))
app.use('/scripts', express.static('scripts'));

app.listen(port, () => {
	console.log(`Server running at http://${hostname}:${port}/`)
	console.log('STRIPE SECRET KEY:' + process.env.STRIPE_SECRET_KEY);

});