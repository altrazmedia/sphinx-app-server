const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true
  }
});

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = { Subject, subjectSchema };
