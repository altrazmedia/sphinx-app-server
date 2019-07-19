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
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true
  }]
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

testSchemaSchema.virtual("created").get(function() {
  // adding the `created` virutal field with the creation date
  return this._id.getTimestamp();
});


const TestSchema = mongoose.model("TestSchema", testSchemaSchema);

module.exports = { TestSchema, testSchemaSchema };
