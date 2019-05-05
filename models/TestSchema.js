const mongoose = require("mongoose");

const testSchemaSchema = new mongoose.Schema({
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
    ref: "Question",
    required: true
  }]

});


const TestSchema = mongoose.model("TestSchema", testSchemaSchema);

module.exports = { TestSchema, testSchemaSchema };
