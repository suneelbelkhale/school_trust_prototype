var mongoose = require('mongoose');

var TransactionSchema = new mongoose.Schema({
  date_requested: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  from_company: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  company_name: {
    type: String,
    required: true
  },
  to_teacher: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  teacher_name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'approved', 'rejected', 'completed'],
    required: true
  },
  requester: {
    type: String,
    enum: ['company', 'teacher'],
    required: true
  },
  date_submitted: Date,
  intended_for: String,
  used_for: String
});


module.exports = mongoose.model('Transaction', TransactionSchema);
// exports.OpenTransaction = mongoose.model('OpenTransaction', TransactionSchema);
// exports.ApprovedTransaction = mongoose.model('ApprovedTransaction', TransactionSchema);
// exports.CompletedTransaction = mongoose.model('CompletedTransaction', TransactionSchema);
