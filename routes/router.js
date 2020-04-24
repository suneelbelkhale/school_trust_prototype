var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var Teacher = require('../models/teacher');


router.get('/', (req, res) => {
  return res.render('index', {session: req.session});
});

// GET route for reading data
router.get('/teacherreglog', function (req, res, next) {
  return res.render('teacherreglog', {session: req.session});
});

//POST route for updating data
router.post('/teacherreglog', function (req, res, next) {
  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    var err = new Error('Passwords do not match.');
    err.status = 400;
    res.send("passwords dont match");
    return next(err);
  }
  if (req.body.email && req.body.first && req.body.last &&
    req.body.username && req.body.password &&
    req.body.passwordConf) {  

    // create new user
    var tData = new Teacher({
      first: req.body.first,
      last: req.body.last,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
    });

    tData.save(function (err) {
      if (err) {
        return next(err);
      } else {
        console.log('USER CREATED:', tData);
        req.session.teacherId = tData._id.valueOf()
        return res.redirect('/teacherdashboard');
      }
    });

  } else if (req.body.logemail && req.body.logpassword) {

    // fetch user and test password verification
    Teacher.findOne({ email: req.body.logemail }, function(err, user) {
        if (err) {
          var err = new Erorr('Wrong email.'); // TODO make this ambiguous
          err.status = 401;
          throw err
        }

        // test a matching password
        user.comparePassword(req.body.logpassword, function(err, isMatch) {
            if (err) {
              var err = new Error('Wrong password.'); // TODO make this ambiguous
              err.status = 401;
              throw err
            }

            if (!isMatch) {
              req.session.failedLogin = true;
              console.log('Wrong password:', user.password)
              return res.redirect('/teacherreglog');
            }
            // SUCCESS
            console.log('SUCCESSFUL LOGIN, ID:', user._id.valueOf());
            req.session.teacherId = user._id.valueOf();
            return res.redirect('/teacherdashboard');
        });

    });
  } else {
    var err = new Error('All fields required.');
    err.status = 400;
    return next(err);
  }
})

// GET route after registering
router.get('/teacherdashboard', function (req, res, next) {
  req.session.failedLogin = false; // shouldnt be necessary but just in case
  Teacher.findById(req.session.teacherId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        return res.render('teacherdash', {teacher: user})
      }
    });
});

// GET for logout logout
router.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

module.exports = router;