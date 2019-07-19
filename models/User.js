const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: [ "student", "teacher", "admin" ],
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
    select: false
  }
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual("created").get(function() {
  // adding the `created` virutal field with the creation date
  return this._id.getTimestamp();
});


userSchema.methods.getPublicFields = function() {
  return {
    email: this.email,
    role: this.role,
    label: this.label,
    _id: this._id,
    created: this.created
  }
}


const User = mongoose.model("User", userSchema);


module.exports = { User, userSchema };

