const express  = require("express");
const mongoose = require("mongoose");

const { Question }   = require("../models/Question");
const { TestSchema }    = require("../models/TestSchema");
const { Subject } = require("../models/Subject");
const { Test }    = require("../models/Test");
const errors      = require("../utils/errorResponses");

const { getTestAttempts } = require("./_utils");


const asyncMiddleware = require("../middleware/asyncMiddleware");
const roles           = require("../middleware/roles");

const router = express.Router();


router.get("/", roles([ "teacher", "admin" ]), asyncMiddleware(async (req, res) => {

  // Finding by subject id if 'subject' query param is provided
  const findObj = req.query.subject ? 
    { subject: req.query.subject } : {};
  
  const tests = await TestSchema
    .find(findObj)
    .populate("subject", "code name")
    .populate("author", "label")

  return res.send(tests);

}));


/**
 * Addint a new test
 */
router.post("/", roles([ "teacher", "admin" ]), asyncMiddleware(async (req, res) => {

  const {
    __user, // author of the request
    name, // test name
    description, // test description
    questions, // array of questions
    subject // subject code
  } = req.body;

  const missingFields = [];

  if (!name || typeof name !== "string") { missingFields.push("name"); }
  if (!subject || typeof subject !== "string") { missingFields.push("subject"); }

  if (questions && questions.constructor !== Array) { missingFields.push("questions"); }
  else if (questions) {
    const invalidQuestions = questionsValidation(questions)
    missingFields.push(...invalidQuestions.map(questionNumber => `question-${questionNumber}`))
  }

  if (missingFields.length > 0) {
    return errors.requiredFields(res, missingFields);
  }


  const matchedSubject = await Subject.findOne({ code: subject.toLowerCase().trim() });
  if (!matchedSubject) {
    // There is no subject with given code
    return errors.notFound(res, [ "subject" ]);
  }

  const _questions = await Question.create(questions);

  let test = new TestSchema({
    name,
    description: description ? String(description) : undefined,
    author: __user._id,
    subject: matchedSubject._id,
    questions: _questions.map(question => question._id)
  });

  test = await test.save();
  test = await TestSchema
    .populate(test, [
      { path: "author", select: "label _id" },
      { path: "subject", select: "code name" },
      { path: "questions"}
    ])


  return res.send(test);


}));


/**
 * Getting the info of a single test
 */
router.get("/:id", roles([ "teacher", "admin" ]), asyncMiddleware(async (req, res) => {

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

}));


/**
 * Editing name and description of a test
 */
router.put("/:id", roles([ "teacher", "admin" ]), asyncMiddleware(async (req, res) => {

  const { id } = req.params;
  const { name, description, __user } = req.body;

  const missingFields = [];
  if (name && typeof name !== "string") { missingFields.push("name"); }
  if (description && typeof description !== "string") { missingFields.push("description"); }

  if (missingFields.length > 0) {
    return errors.requiredFields(res, missingFields);
  }


  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return errors.notFound(res, [ "test" ]);
  }


  let test = await TestSchema.findById(id);
  if (!test) {
    return errors.notFound(res, [ "test" ]);
  }

  if (__user.role !== "admin" || String(__user._id) !== String(test.author)) {
    return res.status(403).send({ message: "Only administrators and author of the test can edit it's data" })
  }

  test.name = name || test.name;
  test.description = description || test.description;


  test = await test.save();
  test = await TestSchema
    .populate(test, [
      { path: "author", select: "label _id" },
      { path: "subject", select: "code name" }
    ]);

  return res.send(test);


}));


/**
 * Adding the list of questions to an existing test
 */
router.post("/addQuestions/:id", roles([ "admin", "teacher" ]), asyncMiddleware(async (req, res) => {

  const { id } = req.params;
  const { questions, __user } = req.body;

  const missingFields = [];

  if (!questions || questions.constructor !== Array) { missingFields.push("questions"); }
  else if (questions) {
    const invalidQuestions = questionsValidation(questions)
    missingFields.push(...invalidQuestions.map(questionNumber => `question-${questionNumber}`))
  }

  if (missingFields.length > 0) {
    return errors.requiredFields(res, missingFields);
  }

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return errors.notFound(res, [ "test" ]);
  }


  let test = await TestSchema.findById(id);
  if (!test) {
    return errors.notFound(res, [ "test" ]);
  }

  if (__user.role !== "admin" || String(__user._id) !== String(test.author)) {
    return res.status(403).send({ message: "Only administrators and author of the test can edit it's data" })
  }

  test.questions.push(...questions);

  test = await test.save();
  test = await TestSchema
    .populate(test, [
      { path: "author", select: "label _id" },
      { path: "subject", select: "code name" }
    ]);

  return res.send(test);

}));



/**
 * Validates questions and returns list with indexes of invalid ones
 * @param {Array} questions Array of questions
 * @returns {Array} indexes of invalid questions
 */
function questionsValidation(questions) {
  const invalidQuestions = [];
    
  for (let index in questions) {
    const question = questions[index];

    if (!question.content || typeof question.content !== "string") { 
      invalidQuestions.push(Number(index) + 1);
      continue;
    }

    if (!question.options || questions.constructor !== Array) {
      invalidQuestions.push(Number(index) + 1);
      continue;
    }

    let isCorrectAnswer = false; // Checking if there is at least one correct answer
    let isValidOption = true;
    for (let option of question.options) {
      if (!option.content || typeof question.content !== "string" || typeof option.correct !== "boolean") {
        isValidOption = false;
        break;
      }

      if (option.correct === true) {
        isCorrectAnswer = true
      }
    }

    if (!isValidOption || !isCorrectAnswer) { 
      invalidQuestions.push(Number(index) + 1)
    }

  }

  return invalidQuestions;

}


module.exports = router;