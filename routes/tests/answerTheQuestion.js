const mongoose = require("mongoose");

const { TestAttempt } = require("../../models/TestAttempt");
const errors = require("../../utils/errorResponses");

/** Answering the question  */
module.exports = async function(req, res) {
  const {
    __user, // Requester
    answer // Array with ids of chosen options
  } = req.body;

  const { test_id, question_id } = req.params;

  if (!answer || answer.constructor !== Array) {
    return errors.requiredFields(res, ["answer"]);
  }

  const notFound = [];

  if (!test_id || !mongoose.Types.ObjectId.isValid(test_id)) {
    notFound.push("test");
  }

  if (!question_id || !mongoose.Types.ObjectId.isValid(question_id)) {
    notFound.push("question");
  }

  if (notFound.length > 0) {
    return errors.notFound(res, notFound);
  }

  // Finding user's attempt
  let attempt = await TestAttempt.findOne({
    student: __user._id,
    test: test_id
  }).populate("test", "status");

  if (!attempt) {
    return errors.notFound(res, ["test"]);
  }

  if (attempt.test.status !== "ongoing") {
    // Test is finished or hasn't started yet - submitting answers is forbidden
    return res.status(400).send({ reason: `test_not_ongoing` });
  }

  const questionIndex = attempt.questions.findIndex(
    question => String(question._id) === question_id
  );
  if (questionIndex === -1) {
    return errors.notFound(res, ["question"]);
  }

  attempt.questions[questionIndex].answer = answer;

  attempt = await attempt.save();

  return res.send(attempt);
};
