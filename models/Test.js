const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  active: {
    type: Boolean, 
    active: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question"
  }]
});

const Test = mongoose.model("Test", testSchema);

module.exports = { Test, testSchema };
