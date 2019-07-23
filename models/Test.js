const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    testSchema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestSchema",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    start: {
      type: Date,
      default: Date.now
    },
    end: {
      type: Date,
      required: true
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

testSchema.virtual("status").get(function() {
  // Adding virtual `status` field based on start and end dates:
  // pending - test hasn't started yet
  // ongoing
  // finished - test is finished
  if (new Date(this.end) - new Date() <= 0) {
    return "finished";
  }
  if (new Date() - new Date(this.start) <= 0) {
    return "pending";
  }
  return "ongoing";
});

const Test = mongoose.model("Test", testSchema);

module.exports = { Test, testSchema };
