const mongoose = require("mongoose");

const testAttemptSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    started: {
      type: Boolean,
      default: false
    },
    questions: [
      {
        questionSchema: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question"
        },
        answer: [
          {
            type: mongoose.Schema.Types.ObjectId
          }
        ]
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

testAttemptSchema.virtual("answered").get(function() {
  // Adding virtual `answered` field with number of already answered questions
  return this.questions.filter(question => question.answer.length > 0).length;
});

const TestAttempt = mongoose.model("TestAttempt", testAttemptSchema);

module.exports = { TestAttempt, testAttemptSchema };
