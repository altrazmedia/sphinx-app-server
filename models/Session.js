const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  expiry: {
    type: Date,
    required: true
  }
});


const Session = mongoose.model("Session", sessionSchema);

module.exports = { Session, sessionSchema };
