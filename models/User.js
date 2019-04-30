const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  roles: {
    type: [{
      type: String,
      enum: [ "student", "teacher", "admin" ]
    }],
    required: true
  },
  label: {
    type: String,
    minlength: 3,
    maxlength: 40
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  active: {
    type: Boolean,
    default: true
  }
});

userSchema.methods.getPublicFields = function() {
  return {
    email: this.email,
    roles: this.roles,
    label: this.label,
    active: this.active,
    _id: this._id
  }
}


const User = mongoose.model("User", userSchema);


module.exports = { User, userSchema };

