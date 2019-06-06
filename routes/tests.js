const express  = require("express");
const mongoose = require("mongoose");

const { Course }   = require("../models/Course");
const { Test }     = require("../models/Test");
const { TestSchema }    = require("../models/TestSchema");
const { TestAttempt }    = require("../models/TestAttempt");
const errors      = require("../utils/errorResponses");
const { getTestAttempts, isAnswerCorrect } = require("./_utils");

const asyncMiddleware = require("../middleware/asyncMiddleware");
const roles           = require("../middleware/roles");

const router = express.Router();

/**
 * Creating a new test
 */
router.post("/", roles([ "teacher" ]), asyncMiddleware(async (req, res) => {

  const {
    schema, // TestSchema id
    course, // Course code
    students, // list of Users with "student" role
    questions, // list of Question ids
    start, // date of test start
    end, // date of test ending
    __user // creator of the test
  } = req.body;


  // VALIDATING REQUIRED FIELDS
  const missingFields = [];

  if (!schema || !mongoose.Types.ObjectId.isValid(schema)) { missingFields.push("schema"); }
  if (!course || typeof course !== "string") { missingFields.push("course"); }
  if (questions) {
    if (questions.constructor !== Array) { missingFields.push("questions"); }
    else {
      for (let question of questions) {
        if (!mongoose.Types.ObjectId.isValid(question)) {
          missingFields.push("questions");
          break;
        }
      }
    }
  }
  if (students) {
    if (students.constructor !== Array) { missingFields.push("students"); }
    else {
      for (let student of students) {
        if (!mongoose.Types.ObjectId.isValid(student)) {
          missingFields.push("students");
          break;
        }
      }
    }
  }

  if (start && !Date.parse(start)) { missingFields.push("start"); }
  if (!end || !Date.parse(end)) { missingFields.push("end"); }

  if (missingFields.length > 0) {
    // Some of required fields haven't been provided or their type is not valid
    return errors.requiredFields(res, missingFields);
  }


  // CHECKING IF THE PROVIDED RESOURCES ARE VALID
  const notFound = [];
  const matchedCourse = await Course
    .findOne({ code: course.toLowerCase().trim() })
    .populate("group");
  if (!matchedCourse) {
    notFound.push("course");
  }

  const matchedSchema = await TestSchema.findById(schema);
  if (!matchedSchema) {
    notFound.push("schema");
  }

  if (notFound.length > 0) {
    // Some of the resources haven't been found
    return errors.notFound(res, notFound);
  }

  if (String(matchedCourse.subject) !== String(matchedSchema.subject)) {
    // TestSchema subject and Course subject have to be the same 
    return errors.notFound(res, [ "schema" ], { reason: "subject_mismatch", message: "Test schema subject has to match a course subject" });
  }


  // CHECKING IF THE TEST CREATOR IS PERMITTED TO CREATE ONE
  if (String(__user._id) !== String(matchedCourse.teacher)) {
    // Requester has to be the teacher of this course
    return res.status(403).send();
  }


  // PREPARING THE LIST OF STUDENTS
  const _students = [];
  if (!students) {
    // List of students wasn't provided - by default all the students from the course are assigned to the test
    _students.push(...matchedCourse.group.students);
  }
  else {
    // Filtering the students 
    _students.push(...matchedCourse.group.students.filter(student => students.includes(String(student))));
  }

  // PREPARING THE LIST OF QUESTIONS
  const _questions = [];
  if (!students) {
    // List of questions wasn't provided - by default all the questions from the TestSchema are assigned to the test
    _questions.push(...matchedSchema.questions);
  }
  else {
    // Filtering the questions from TestSchema
    _questions.push(...matchedSchema.questions.filter(question => questions.includes(String(question._id))));
  }

  
  // CREATING AND SAVING THE TEST OBJECT
  let test = new Test({
    testSchema: schema,
    course: matchedCourse._id,
    students: _students,
    start,
    end: new Date(end),
    questions: _questions,
  });

  test = await test.save();
  test = await Test
    .findById(test._id)
    .populate("students")
    .populate("questions")

  test = test.toObject();

  // CREATING TESTATTEMPT OBJECTS
  let attempts = await TestAttempt.create(_students.map(student => ({
    student,
    test: test._id,
    started: false,
    questions: _questions.map(question => ({
      questionSchema: question,
      answer: []
    }))
  })));

  
  test.attempts = attempts;
  res.send(test);

}));


/**
 * Getting the list of tests user is leading
 */
router.get("/my-lead", asyncMiddleware(async (req, res) => {
  
  const { __user } = req.body;
  const { course } = req.query; // Course code; if provided, only tests assigned to this course will be returned

  let findObj;

  if (course) {
    const matchedCourse = await Course.findOne({ code: course, teacher: __user._id });
    if (!matchedCourse) {
      return errors.notFound(res, [ "course" ])
    }
    findObj = { course: matchedCourse._id }
  }

  else {
    const courses = await Course.find({ teacher: __user._id }); // list of courses the logged user is teaching
    findObj = {
      course: {
        $in: courses.map(course => course._id)
      }
    }
  }

  const tests = await Test
    .find(findObj)
    .select("course testSchema start end status")
    .populate("course")
    .populate("testSchema", "name");
  
  res.send(tests);

}));

/**
 * Getting the list of tests user is attending
 */
router.get("/my", asyncMiddleware(async (req, res) => {

  const { __user } = req.body; 
  const { course } = req.query; // Course code; if provided, only tests assigned to this course will be returned

  const findObj = {
    students: __user._id 
  }

  if (course) {
    // We're looking only for a course with code provided in request query
    const matchedCourse = await Course.findOne({ code: course.trim().toLowerCase() });
    if (!matchedCourse) {
      return errors.notFound(res, [ "course" ])
    }
    findObj.course = matchedCourse._id;
  }


  let tests = await Test
    .find(findObj)
    .select("course testSchema start end status")
    .populate({
      path: "course",
      populate: { path: "subject" }
    })
    .populate("testSchema", "name");
  
  tests = tests.map(test => test.toObject())
  

  for (test of tests) {
    
    const attempt = await TestAttempt
      .findOne({ test: test._id, student: __user._id })
      .populate("questions.questionSchema");

    if (test.status === "ongoing") {
      test.questionsQuantity = attempt.questions.length; // Total number of questions
      test.questionsAnswered = attempt.questions.filter(question => question.answer.length > 0).length; // Number of answered questions
    }
    else if (tests.status === "finished") {
      // Getting the number of correctly answered questions
      let validAnswers = 0;
      attempt.questions.forEach(question => {
        const validOptions = question.questionSchema.options.filter(option => option.correct).map(option => option._id);
        const answer = question.answer; // User's answer
        if (isAnswerCorrect(answer, validOptions)) {
          // User has answwered this question correctly
          validAnswers++;
        }
      })
      test.questionsQuantity = attempt.questions.length; // Total number of questions
      test.validAnswers = validAnswers;
    }
    
  }


  res.send(tests); 


}));


/**
 * Getting the info about a single test
 */
router.get("/single/:id", asyncMiddleware(async (req, res) => {

  const { id } = req.params;
  const { __user } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return errors.notFound(res, [ "test" ]);
  }


  let test = await Test
    .findById(id)
    .populate({
      path: "course",
      populate: { path: "subject teacher group" }
    })
    .populate("testSchema", "name description")
    .populate("questions")


  if (!test) {
    return errors.notFound(res, [ "test" ])
  }

  test = test.toObject();
  test.my_access = "none";

  if (String(test.course.teacher._id) === String(__user._id)) {
    // User is leading this test
    test.my_access = "teacher";
    const attempts = await getTestAttempts({ test: id }, test.questions, test.status === "finished")
    test.attempts = attempts;

  } 

  else if (__user.role === "student") { 

    if (!test.students.map(student => String(student)).includes(String(__user._id))) {
      // Student is not taking a part in this test
      return res.status(403).send();
    }

    test.my_access = "student";

    if (test.status === "ongoing" || test.status === "finished") {

      let attempt = await TestAttempt.findOne({ student: __user._id, test: id }); // Finding user's attempt to this test
      attempt = attempt.toObject();

      attempt.questions.forEach(question => {
        const { questionSchema } = question;
        const matchedQuestion = test.questions.find(question => String(question._id) === String(questionSchema));
        question.content = matchedQuestion.content;
        question.options = matchedQuestion.options.map(option => ({ 
          content: option.content, 
          _id: option._id,
          correct: test.status === "finished" ? option.correct : undefined
        })); 

        if (test.status === "finished") {
          // Test is finished - checking if the procided answer is correct
          const correctOptions = matchedQuestion.options.filter(option => option.correct).map(option => option._id);
          question.correct = isAnswerCorrect(question.answer, correctOptions);
        }

      })

      if (test.status === "finished") {
        // Calculating the score
        attempt.correctAnswers = attempt.questions.filter(question => question.correct).length;
        attempt.score = Math.floor(100 * 100 * attempt.correctAnswers / attempt.questions.length) / 100;
      }


      test.my_attempt = attempt;

    }

    test.questions = undefined;

  }

  res.send(test)


}));



/**
 * Answering the question
 */
router.put("/answer/:test_id/:question_id", roles("student"), asyncMiddleware(async (req, res) => {

  const { 
    __user, // Requester
    answer  // Array with ids of chosen options
  } = req.body;

  const {
    test_id,
    question_id
  } = req.params;

  if (!answer || answer.constructor !== Array) {
    return errors.requiredFields(res, [ "answer" ]);
  }

  const notFound = [];

  if (!test_id || !mongoose.Types.ObjectId.isValid(test_id)) {
    notFound.push("test")
  }
  
  if (!question_id || !mongoose.Types.ObjectId.isValid(question_id)) {
    notFound.push("question")
  }

  if (notFound.length > 0) {
    return errors.notFound(res, notFound);
  }

  // Finding user's attempt
  let attempt = await TestAttempt
    .findOne({ student: __user._id, test: test_id })
    .populate("test", "status");

  if (!attempt) {
    return errors.notFound(res, [ "test" ]);
  }

  if (attempt.test.status !== "ongoing") {
    // Test is finished or hasn't started yet - submitting answers is forbidden
    return res.status(400).send({ reason: `test_not_ongoing` })
  }

  const questionIndex = attempt.questions.findIndex(question => String(question._id) === question_id);
  if (questionIndex === -1) {
    return errors.notFound(res, [ "question" ]);
  }

  attempt.questions[questionIndex].answer = answer;

  attempt = await attempt.save();

  return res.send(attempt)

}))




module.exports = router;