const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  code: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  active: {
    type: Boolean,
    default: true
  }
});

const Group = mongoose.model("Group", groupSchema);

module.exports = { Group, groupSchema };
