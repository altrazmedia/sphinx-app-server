const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true
    },
    options: [
      {
        content: {
          type: String,
          required: true
        },
        correct: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

questionSchema.virtual("multiple").get(function() {
  // Virtual field `multiple` equals to `true` if there are more than one correct options
  return this.options.filter(e => e.correct).length > 1;
});

const Question = mongoose.model("Question", questionSchema);

module.exports = { Question, questionSchema };
