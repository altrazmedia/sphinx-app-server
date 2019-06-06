const express  = require("express");
const mongoose = require("mongoose");

const { Group }   = require("../models/Group");
const { Course } = require("../models/Course");
const { Subject } = require("../models/Subject");
const { User }    = require("../models/User");
const { Test }    = require("../models/Test");
const errors      = require("../utils/errorResponses");

const { getTestAttempts } = require("./_utils")

const asyncMiddleware = require("../middleware/asyncMiddleware");
const roles           = require("../middleware/roles");

const router = express.Router();

// TODO: Editing the course


/**
 * Getting the list of all courses
 */
router.get("/", roles([ "teacher", "admin" ]), asyncMiddleware(async (req, res) => {

  const courses = await Course
    .find()
    .populate("teacher", "_id label")
    .populate("group", "code name")
    .populate("subject", "code name")
    .sort({
      active: "desc",
      name: "asc",
      code: "asc"
    });

  return res.send(courses);

}));


/**
 * Adding the new course
 */
router.post("/", roles([ "admin" ]), asyncMiddleware(async (req, res) => {

  const { 
    teacher,  // User id
    group,    // Group code
    subject,  // Subject code
    code      // unique course code
  } = req.body;

  const missingFields = [];
  if (!code || typeof code !== "string") { missingFields.push("code"); }
  if (!group || typeof group !== "string") { missingFields.push("group"); }
  if (!subject || typeof subject !== "string") { missingFields.push("subject"); }
  if (!teacher || !mongoose.Types.ObjectId.isValid(teacher)) { missingFields.push("teacher"); }


  if (missingFields.length > 0) {
    // Some of the required fields are not provided or their type is not valid
    return errors.requiredFields(res, missingFields);
  }


  const notFound = [];
  
  const matchedGroup    = await Group.findOne({ code: group.toLowerCase().trim(), active: true });
  if (!matchedGroup) { notFound.push("group"); }

  const matchedSubject  = await Subject.findOne({ code: subject.toLowerCase().trim(), active: true });
  if (!matchedSubject) { notFound.push("subject"); }

  const matchedTeacher = await User.findOne({ _id: teacher.trim(), active: true, role: "teacher" });
  if (!matchedTeacher) { notFound.push("teacher"); }

  if (notFound.length > 0) {
    return errors.notFound(res, notFound);
  }


  const matchedByCode = await Course.findOne({ code: code.toLowerCase().trim() });
  if (matchedByCode) {
    // There already is a different course with that code
    return errors.duplicate(res, [ "code" ]);
  }


  let course = new Course({
    code,
    teacher,
    group: matchedGroup._id,
    subject: matchedSubject._id
  });

  course = await course.save();
  course = await Course
    .populate(course, [
      { path: "teacher", select: "_id label" },
      { path: "subject", select: "code name" },
      { path: "group", select: "code name" },
    ])


  return res.send(course)
  


}));


/**
 * Returns the list of courses the logged user is part of
 */
router.get("/my", asyncMiddleware(async (req, res) => {

  const { __user } = req.body; // Requester

  // Getting the list of groups the user is part of
  const groups = await Group.find({ students: __user._id });

  // Getting the list of courses asigned to user's groups
  const courses = await Course
    .find({ 
      group: { 
        "$in": groups.map(group => group._id) 
      } 
    })
    .populate("teacher", "label")
    .populate("group", "name code")
    .populate("subject", "name code")
    .sort({ active: "desc" })

  return res.send(courses);

}));


/**
 * Returns the list of courses the logged user is leading
 */
router.get("/my-lead", asyncMiddleware(async (req, res) => {

  const { __user } = req.body; // Requester

  const courses = await Course
    .find({ teacher: __user._id })
    .populate("teacher", "label")
    .populate("group", "name code")
    .populate("subject", "name code")
    .sort({ active: "desc" })

  return res.send(courses);

}));


router.get("/single/:code", asyncMiddleware(async (req, res) => {

  const { __user } = req.body; // Requester
  const { code } = req.params;

  let course = await Course
    .findOne({ code: code.toLowerCase().trim() })
    .populate("teacher", "label")
    .populate({
      path: "group",
      select: "name code students",
      populate: {
        path: "students",
        select: "label email"
      }
    })
    .populate("subject", "name code");

  if (!course) {
    return errors.notFound(res, [ "course" ]);
  }


  course = course.toObject();
  course.my_access = "none";

  if (String(course.teacher._id) === String(__user._id)) {
    // logged user is the teacher assigned to this course
    course.my_access = "teacher";

    // Getting the list of tests
    const tests = await Test
      .find({ course: course._id })
      .populate("testSchema", "name description")
      .populate("students")
      .populate("questions");


    const finishedTests = tests
      .filter(test => test.status === "finished") // filtering on virtual field
      .map(test => test.toObject());


    for (test of finishedTests) {
      // Getting the informations about students' attempts
      const attempts = await getTestAttempts({ test: test._id }, test.questions, true);
      test.attempts = attempts;
    }

    course.finishedTests = finishedTests;

  }


  else if (__user.role === "student") {
    // Checking if the logged user is a parto of group assigned to this course
    const index = course.group.students.findIndex(student => String(student._id) === String(__user._id));
    if (index > -1) {
      course.my_access = "student"

      // Getting the results of finished tests completed by the user
      const tests = await Test
        .find({ course: course._id })
        .select("status end start testSchema questions")
        .populate("testSchema", "name description")
        .populate("questions");


      const finishedTests = tests
        .filter(test => test.status === "finished") // filtering on virtual field
        .map(test => test.toObject());

      const my_results = [];

      for (test of finishedTests) {
        // Getting the informations about students' attempts
        const attempts = await getTestAttempts({ test: test._id, student: __user._id }, test.questions, true);
        if (attempts.length > 0) {
          test.attempt = attempts[0];
          my_results.push(test);
        }
      }

      course.my_results = my_results;

    }
  }




  res.send(course)

}));


module.exports = router;