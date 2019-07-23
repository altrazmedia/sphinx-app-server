/* eslint-disable no-restricted-syntax */
const mongoose = require("mongoose");

const { Test } = require("../../models/Test");
const { TestSchema } = require("../../models/TestSchema");
const { TestAttempt } = require("../../models/TestAttempt");
const { Course } = require("../../models/Course");
const errors = require("../../utils/errorResponses");

/** Creating a new test */
module.exports = async function(req, res) {
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

  if (!schema || !mongoose.Types.ObjectId.isValid(schema)) {
    missingFields.push("schema");
  }
  if (!course || typeof course !== "string") {
    missingFields.push("course");
  }
  if (questions) {
    if (questions.constructor !== Array) {
      missingFields.push("questions");
    } else {
      for (const question of questions) {
        if (!mongoose.Types.ObjectId.isValid(question)) {
          missingFields.push("questions");
          break;
        }
      }
    }
  }
  if (students) {
    if (students.constructor !== Array) {
      missingFields.push("students");
    } else {
      for (const student of students) {
        if (!mongoose.Types.ObjectId.isValid(student)) {
          missingFields.push("students");
          break;
        }
      }
    }
  }

  if (start && !Date.parse(start)) {
    missingFields.push("start");
  }
  if (!end || !Date.parse(end)) {
    missingFields.push("end");
  }

  if (missingFields.length > 0) {
    // Some of required fields haven't been provided or their type is not valid
    return errors.requiredFields(res, missingFields);
  }

  // CHECKING IF THE PROVIDED RESOURCES ARE VALID
  const notFound = [];
  const matchedCourse = await Course.findOne({
    code: course.toLowerCase().trim()
  }).populate("group");
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
    return errors.notFound(res, ["schema"], {
      reason: "subject_mismatch",
      message: "Test schema subject has to match a course subject"
    });
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
  } else {
    // Filtering the students
    _students.push(
      ...matchedCourse.group.students.filter(student =>
        students.includes(String(student))
      )
    );
  }

  // PREPARING THE LIST OF QUESTIONS
  const _questions = [];
  if (!students) {
    // List of questions wasn't provided - by default all the questions from the TestSchema are assigned to the test
    _questions.push(...matchedSchema.questions);
  } else {
    // Filtering the questions from TestSchema
    _questions.push(
      ...matchedSchema.questions.filter(question =>
        questions.includes(String(question._id))
      )
    );
  }

  // CREATING AND SAVING THE TEST OBJECT
  let test = new Test({
    testSchema: schema,
    course: matchedCourse._id,
    students: _students,
    start,
    end: new Date(end),
    questions: _questions
  });

  test = await test.save();
  test = await Test.findById(test._id)
    .populate("students")
    .populate("questions");

  test = test.toObject();

  // CREATING TESTATTEMPT OBJECTS
  const attempts = await TestAttempt.create(
    _students.map(student => ({
      student,
      test: test._id,
      started: false,
      questions: _questions.map(question => ({
        questionSchema: question,
        answer: []
      }))
    }))
  );

  test.attempts = attempts;
  return res.send(test);
};
