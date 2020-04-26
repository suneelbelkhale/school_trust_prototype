var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var Teacher = require('../models/teacher');
var Company = require('../models/company');
var Transaction = require('../models/transaction');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.get('/', (req, res) => {
  return res.render('index', {session: req.session});
});


//////////////////////////////////////////////////////////////

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
        console.log('TEACHER CREATED:', tData);
        req.session.teacherId = tData._id.valueOf()
        return res.redirect('/teacherdashboard');
      }
    });

  } else if (req.body.logemail && req.body.logpassword) {

    // fetch user and test password verification
    Teacher.findOne({ email: req.body.logemail }, function(err, user) {
        if (err) throw err;

        // wrong email
        if (user == null) {
          req.session.failedLogin = true;
          return res.redirect('/teacherreglog');          
        }

        // test a matching password
        user.comparePassword(req.body.logpassword, function(err, isMatch) {
            if (err) throw err;

            if (!isMatch) {
              req.session.failedLogin = true;
              console.log('Wrong password:', user.password)
              return res.redirect('/teacherreglog');
            }
            // SUCCESS
            console.log('SUCCESSFUL TEACHER LOGIN, ID:', user._id.valueOf());
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
  Teacher.findById(req.session.teacherId)
    .exec(function (error, user) {
      if (error) { throw error; } else if (!user) {
        res.send('Not logged in.');
      } else {
        Company.find({}).exec(async function (err, docs) {
          if (err) throw err;
          var cnames = docs.map((company, idx, arr) => company.name)
          cnames.sort()

          var alltrans = await Transaction.find({_id: {$in: user.transaction_ids}}).exec();
          var opent = alltrans.filter((trans, idx, arr) => trans.status == 'open');
          var apprt = alltrans.filter((trans, idx, arr) => trans.status == 'approved');
          var rejet = alltrans.filter((trans, idx, arr) => trans.status == 'rejected');
          var compt = alltrans.filter((trans, idx, arr) => trans.status == 'completed');

          return res.render('teacherdash', {teacher: user, 
            company_names: cnames, 
            open_transactions: opent,
            approved_transactions: apprt,
            rejected_transactions: rejet,
            completed_transactions: compt})
        });
      }
    });
});

// POST route for creating transaction
router.post('/teacheropentransaction', function (req, res, next) {
  Teacher.findById(req.session.teacherId).exec(function (error, user) {
    if (error) { return next(error) };
    Company.findOne({'name': req.body.company}).exec(function (error, company) {
      if (error) throw error;
      Transaction.create({
          date_requested: new Date(),
          amount: req.body.transaction_amount,
          from_company: company._id,
          company_name: req.body.company,
          to_teacher: req.session.teacherId,
          teacher_name: user.first + " " + user.last,
          intended_for: req.body.intended_for,
          status: 'open',
          requester: 'teacher'
      }, (err, transaction) => {
        if (err) throw err;
        console.log("Open transaction created:", transaction._id.valueOf());
        user.transaction_ids.push(transaction._id);
        company.transaction_ids.push(transaction._id);
        user.save(function (err, post) { if (err) throw err; });
        company.save(function (err, post) { if (err) throw err; });
      });
      return res.redirect('/teacherdashboard');
    });
  });
});


//////////////////////////////////////////////////////////////

// GET route for reading data
router.get('/companyreglog', function (req, res, next) {
  return res.render('companyreglog', {session: req.session});
});

//POST route for updating data
router.post('/companyreglog', function (req, res, next) {
  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    var err = new Error('Passwords do not match.');
    err.status = 400;
    res.send("passwords dont match");
    return next(err);
  }
  if (req.body.email && req.body.name &&
    req.body.username && req.body.password &&
    req.body.passwordConf) {  

    // create new user
    var cData = new Company({
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
    });

    cData.save(function (err) {
      if (err) {
        return next(err);
      } else {
        console.log('SPONSOR CREATED:', cData);
        req.session.companyId = cData._id.valueOf()
        return res.redirect('/companydashboard');
      }
    });

  } else if (req.body.logemail && req.body.logpassword) {

    // fetch user and test password verification
    Company.findOne({ email: req.body.logemail }, function(err, user) {
        if (err) throw err;

        // wrong email
        if (user == null) {
          req.session.failedLogin = true;
          return res.redirect('/companyreglog');          
        }

        // test a matching password
        user.comparePassword(req.body.logpassword, function(err, isMatch) {
            if (err) throw err;

            if (!isMatch) {
              req.session.failedLogin = true;
              console.log('Wrong password:', user.password)
              return res.redirect('/companyreglog');
            }
            // SUCCESS
            console.log('SUCCESSFUL SPONSOR LOGIN, ID:', user._id.valueOf());
            req.session.companyId = user._id.valueOf();
            return res.redirect('/companydashboard');
        });

    });
  } else {
    var err = new Error('All fields required.');
    err.status = 400;
    return next(err);
  }
})

// GET route after registering
router.get('/companydashboard', function (req, res, next) {
  Company.findById(req.session.companyId)
    .exec(function (error, user) {
      if (error) { throw error; } else if (!user) {
        res.send('Not logged in.');
      } else {
        Teacher.find({}).exec(async function (err, docs) {
          if (err) throw err;
          var tnames = docs.map((teacher, idx, arr) => { 
            return {'name': teacher.first + " " + teacher.last, 'id': teacher._id}; 
          });
          tnames.sort((a, b) => a.name < b.name);

          var alltrans = await Transaction.find({_id: {$in: user.transaction_ids}}).exec();
          var opent = alltrans.filter((trans, idx, arr) => trans.status == 'open');
          var apprt = alltrans.filter((trans, idx, arr) => trans.status == 'approved');
          var rejet = alltrans.filter((trans, idx, arr) => trans.status == 'rejected');
          var compt = alltrans.filter((trans, idx, arr) => trans.status == 'completed');

          return res.render('companydash', {company: user, 
            teacher_names: tnames, 
            open_transactions: opent,
            approved_transactions: apprt,
            rejected_transactions: rejet,
            completed_transactions: compt})
        });
      }
    });
});

// POST route for creating transaction
router.post('/companyopentransaction', function (req, res, next) {
  Company.findById(req.session.companyId).exec(function (error, user) {
    if (error) { return next(error) };
    Teacher.findById(req.body.teacher).exec(function (error, teacher) {
      if (error) throw error;
      Transaction.create({
          date_requested: new Date(),
          amount: req.body.transaction_amount,
          from_company: user._id,
          company_name: user.name,
          to_teacher: teacher._id,
          teacher_name: teacher.first + " " + teacher.last,
          status: 'open',
          requester: 'company'
      }, (err, transaction) => {
        if (err) throw err;
        console.log("Open transaction created:", transaction._id.valueOf());
        user.transaction_ids.push(transaction._id);
        teacher.transaction_ids.push(transaction._id);
        user.save(function (err, post) { if (err) throw err; });
        teacher.save(function (err, post) { if (err) throw err; });
      });
      return res.redirect('/companydashboard');
    });
  });
});


/////////////////////////////////////////////////////

// GET for logout
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


// POST route for cancelling a transaction request or clearing a rejected one
router.post('/deletetransaction', function (req, res, next) {
  if (!req.session.teacherId && !req.session.companyId) 
    throw Error("No authorization to delete transaction")

  Transaction.findOne({_id: req.body.delete_id, status: {$in: ['open', 'rejected']}}).exec(async function (err, trans) {
    if (err) throw err;
    if (!trans)
      throw Error("No such transaction or transaction is not open/rejected!")
    if (!(trans.requester == 'company' && trans.from_company == req.session.companyId) &&
        !(trans.requester == 'teacher' && trans.to_teacher == req.session.teacherId) ) {
      console.log("mislinked transaction:", req.body.delete_id.valueOf());
      throw Error('No authorized parties present on this transaction')
    }
    await Company.updateOne({_id: trans.from_company}, { $pullAll: {transaction_ids: [req.body.delete_id]} } ).exec();
    await Teacher.updateOne({_id: trans.to_teacher},   { $pullAll: {transaction_ids: [req.body.delete_id]} } ).exec();
    
    await Transaction.deleteOne({ _id: req.body.delete_id}).exec();
  });

  if (req.session.teacherId) return res.redirect('/teacherdashboard');
  else if (req.session.companyId) return res.redirect('/companydashboard');
});


// POST route for approving or rejecting an open request
router.post('/approveorrejectopentransaction', function (req, res, next) {
  if (!req.session.teacherId && !req.session.companyId) 
    throw Error("No authorization to approve/reject transaction")

  Transaction.findOne({_id: req.body.modify_id, status: 'open'}).exec(async function (err, trans) {
    if (err) throw err;
    if (!trans)
      throw Error("No such transaction or transaction is not open!")
    if (!(trans.requester == 'teacher' && trans.from_company == req.session.companyId) &&
        !(trans.requester == 'company' && trans.to_teacher == req.session.teacherId) ) {
      console.log("mislinked transaction modification:", req.body.modify_id.valueOf());
      throw Error('No authorized parties present on this transaction')
    }
    if (req.body.req_action == 'Approve request') {
      await Transaction.updateOne({ _id: req.body.modify_id}, {status: 'approved'}).exec();
    }
    else if (req.body.req_action == 'Reject request')
      await Transaction.updateOne({ _id: req.body.modify_id}, {status: 'rejected'}).exec();
    else
      return res.send(`Request action \'${req.body.req_action}\' was improper.`)
  });

  if (req.session.teacherId) return res.redirect('/teacherdashboard');
  else if (req.session.companyId) return res.redirect('/companydashboard');
});

router.post('/makepayment', function (req, res, next) {
  if (!req.session.companyId)
    throw Error("No authorization to approve/reject transaction")

  Transaction.findById(req.body.transaction_id, async function (error, trans) {
    if (error) return next(error)
    if (!trans) return next(new Error('No transaction found'));
    // TODO do more checks here
    if (trans.from_company != req.session.companyId) 
      return next(new Error('Unauthorized to pay for this transaction.'))

    return res.render('payment', {session: req.session, transaction: trans, STRIPE_PUB_KEY: process.env.STRIPE_PUB_KEY});
  });
});

/////////////////////////////////////////////////////
//STRIPE STUFF

router.get('/linkstripeaccount', async function(req, res, next) {
  var user = null;
  if (req.session.teacherId) {
    user = await Teacher.findById(req.session.teacherId).exec()
  } else if (req.session.companyId) {
    user = await Company.findById(req.session.companyId).exec()
  } else {
    return next(new Error('No authorization'));
  }

  if (user.stripe_account_id) {
    return res.send('This user already has an account linked. <a href=/unlinkstripeaccount>Unlink</a>')
  }

  return res.render('link_stripe', {session: req.session, user_email: user.email});
});


router.get('/unlinkstripeaccount', async function(req, res, next) {
  var user = null;
  if (req.session.teacherId) {
    user = await Teacher.findById(req.session.teacherId).exec()
  } else if (req.session.companyId) {
    user = await Company.findById(req.session.companyId).exec()
  } else {
    return next(new Error('No authorization'));
  }

  if (!user.stripe_account_id) {
    return res.send('This user has no account linked. <a href=/linkstripeaccount>Link</a>')
  }
  
  const response = await stripe.oauth.deauthorize({
    client_id: process.env.STRIPE_CLIENT_ID,
    stripe_user_id: user.stripe_account_id,
  });
  user.stripe_account_id = null;
  await user.save();
  return res.send('Account has been unlinked. <a href=/>Home</a>')
});


router.get('/addstripeaccount', async function (req, res, next) {

  if (!req.session.teacherId && !req.session.companyId) 
    return next(new Error("No authorization to add account"));

  var who = req.session.teacherId === null ? 'company' : 'teacher';

  if (req.query.error) {
    console.log("Did not add account.");
    return res.send(`Unable to link account for ${who}`);
  }
  
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code: req.query.code
  });

  if (response.error) return next(response.error);

  console.log('User linked', response.stripe_user_id)

  if (who == 'teacher') { 
    await Teacher.updateOne({_id: req.session.teacherId}, {stripe_account_id: response.stripe_user_id}).exec();
    return res.redirect('/teacherdashboard')
  }
  else { 
    await Company.updateOne({_id: req.session.companyId}, {stripe_account_id: response.stripe_user_id}).exec();
    return res.redirect('/companydashboard')
  }
});


router.post('/checkout', (req, res, next) => {
  Transaction.findById(req.body.transaction_id, function (error, trans) {
    if (error) return next(error)
    if (!trans) return next(new Error('No transaction found'));
      // TODO do more checks here
    Teacher.findById(trans.to_teacher, (error, teacher) => {
      if (error) return next(error)
      if (!teacher) return next(new Error('No transaction found'));
      if (trans.status != 'approved') return next(new Error('Transaction not yet approved!'));
      if (teacher.stripe_account_id == null)
        return res.send('Recipient does not have a connected Stripe account.');
      var charge = stripe.charges.create({
          amount: trans.amount*100, // in cents
          currency: 'usd',
          source: req.body.stripeToken,
          description: `Payment from ${trans.company_name} to ${trans.teacher_name}`,
          application_fee: 0,
        },
        {stripeAccount: teacher.stripe_account_id},
        async function(error, charge) {
          if (error) return next(error)

          // update transaction to reflect completion
          trans.status = 'completed';
          trans.date_completed = new Date()
          await trans.save()

          return res.render('success', {session: req.session, recipient_name: trans.teacher_name})
        }
      );
    });
  });
});

module.exports = router;