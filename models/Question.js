const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  options: [{
    content: {
      type: String,
      required: true
    },
    correct: {
      type: Boolean,
      default: false
    }
  }]
});

const Question = mongoose.model("Question", questionSchema);

module.exports = { Question, questionSchema };
