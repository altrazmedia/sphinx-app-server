const mongoose = require("mongoose");

const testAttemptSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  started: {
    type: Boolean,
    default: false
  },
  questions: [{
    questionSchema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
    answer: [{
      type: mongoose.Schema.Types.ObjectId
    }]
  }]
});

const TestAttempt = mongoose.model("TestAttempt", testAttemptSchema);

module.exports = { TestAttempt, testAttemptSchema };
