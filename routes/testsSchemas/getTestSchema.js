const mongoose = require("mongoose");

const { TestSchema } = require("../../models/TestSchema");
const { Test }       = require("../../models/Test");
const errors         = require("../../utils/errorResponses");

const { getTestAttempts } = require("../tests/_utils");


module.exports = async function(req, res) {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return errors.notFound(res, [ "testSchema" ]);
  }

  let testSchema = await TestSchema
    .findById(id)
    .populate("author", "label _id")
    .populate("subject", "code name")
    .populate("questions")

  if (!testSchema) {
    return errors.notFound(res, [ "testSchema" ])
  }
  testSchema = testSchema.toObject();

  // GETTING THE STATS OF THIS TEST SCHEMA

  testSchema.questions.forEach(question => {
    question.asked = 0; // how many times this question was used
    question.answeredCorrectly = 0; // how many times this question was answered correctly
  })

  // all the tests which use this testSchema
  let tests = await Test
    .find({ testSchema: id })
    .populate("course", "code");

  tests = tests
    .filter(test => test.status === "finished") // Filtering by virtual field; getting only finished tests
    .map(test => test.toObject())

  let totalGlobalScore = 0; // total score of all attempts
  let totalAttempts = 0; // number of all attempts

  for (test of tests) {
    const attempts = await getTestAttempts({ test: test._id }, testSchema.questions, true, true); // all attempts in this test
    let totalScore = 0; // total score of all attempts in this test
    attempts.forEach(attempt => {
      totalScore += attempt.score;
      totalGlobalScore += attempt.score;
      totalAttempts++;

      attempt.questions.forEach(question => {
        // Cheching how many times particular questions have been answered correctly
        const questionIndex = testSchema.questions.findIndex(q => String(q._id) === String(question.questionSchema));
        if (questionIndex > -1) {
          testSchema.questions[questionIndex].asked++;
          if (question.correct) {
            testSchema.questions[questionIndex].answeredCorrectly++;
          }
        }
      })
    })

    const averageScore = totalScore === 0 ? 0 : Math.floor(100 * totalScore / attempts.length) / 100; // average score in this test

    test.averageScore = averageScore;    
  }

  testSchema.tests = tests;
  testSchema.totalAttempts = totalAttempts;
  testSchema.averageScore = totalGlobalScore === 0 ? 0 : Math.floor(100 * totalGlobalScore / totalAttempts) / 100;


  return res.send(testSchema);
}