const express  = require("express");
const mongoose = require("mongoose");

const { Question }   = require("../models/Question");
const { TestSchema }    = require("../models/TestSchema");
const { Subject } = require("../models/Subject");
const { User }    = require("../models/User");
const errors      = require("../utils/errorResponses");

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
    return errors.notFound(res, [ "test" ]);
  }

  const test = await TestSchema
    .findById(id)
    .populate("author", "label _id")
    .populate("subject", "code name");

  if (!test) {
    return errors.notFound(res, [ "test" ])
  }


  return res.send(test);

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