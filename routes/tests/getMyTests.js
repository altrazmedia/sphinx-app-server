/* eslint-disable no-restricted-syntax */
const { Course } = require("../../models/Course");
const { Test } = require("../../models/Test");
const { TestAttempt } = require("../../models/TestAttempt");
const errors = require("../../utils/errorResponses");

const { isAnswerCorrect } = require("./_utils");

/** Getting the list of tests user is attending  */
module.exports = async function(req, res) {
  const { __user } = req.body;
  const { course } = req.query; // Course code; if provided, only tests assigned to this course will be returned

  const findObj = {
    students: __user._id
  };

  if (course) {
    // We're looking only for a course with code provided in request query
    const matchedCourse = await Course.findOne({
      code: course.trim().toLowerCase()
    });
    if (!matchedCourse) {
      return errors.notFound(res, ["course"]);
    }
    findObj.course = matchedCourse._id;
  }

  let tests = await Test.find(findObj)
    .select("course testSchema start end status")
    .populate({
      path: "course",
      populate: { path: "subject" }
    })
    .populate("testSchema", "name");

  tests = tests.map(test => test.toObject());

  for (const test of tests) {
    const attempt = await TestAttempt.findOne({
      test: test._id,
      student: __user._id
    }).populate("questions.questionSchema");

    if (test.status === "ongoing") {
      test.questionsQuantity = attempt.questions.length; // Total number of questions
      test.questionsAnswered = attempt.questions.filter(
        question => question.answer.length > 0
      ).length; // Number of answered questions
    } else if (tests.status === "finished") {
      // Getting the number of correctly answered questions
      let validAnswers = 0;
      attempt.questions.forEach(question => {
        const validOptions = question.questionSchema.options
          .filter(option => option.correct)
          .map(option => option._id);
        const { answer } = question; // User's answer
        if (isAnswerCorrect(answer, validOptions)) {
          // User has answwered this question correctly
          validAnswers++;
        }
      });
      test.questionsQuantity = attempt.questions.length; // Total number of questions
      test.validAnswers = validAnswers;
    }
  }

  return res.send(tests);
};
