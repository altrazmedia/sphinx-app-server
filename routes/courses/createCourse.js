const mongoose = require("mongoose");

const { Group } = require("../../models/Group");
const { Course } = require("../../models/Course");
const { Subject } = require("../../models/Subject");
const { User } = require("../../models/User");
const errors = require("../../utils/errorResponses");

/** Creating a new course */
module.exports = async function(req, res) {
  const {
    teacher, // User id
    group, // Group code
    subject, // Subject code
    code // unique course code
  } = req.body;

  const missingFields = [];
  if (!code || typeof code !== "string") {
    missingFields.push("code");
  }
  if (!group || typeof group !== "string") {
    missingFields.push("group");
  }
  if (!subject || typeof subject !== "string") {
    missingFields.push("subject");
  }
  if (!teacher || !mongoose.Types.ObjectId.isValid(teacher)) {
    missingFields.push("teacher");
  }

  if (missingFields.length > 0) {
    // Some of the required fields are not provided or their type is not valid
    return errors.requiredFields(res, missingFields);
  }

  const notFound = [];

  const matchedGroup = await Group.findOne({
    code: group.toLowerCase().trim()
  });
  if (!matchedGroup) {
    notFound.push("group");
  }

  const matchedSubject = await Subject.findOne({
    code: subject.toLowerCase().trim()
  });
  if (!matchedSubject) {
    notFound.push("subject");
  }

  const matchedTeacher = await User.findOne({
    _id: teacher.trim(),
    role: "teacher"
  });
  if (!matchedTeacher) {
    notFound.push("teacher");
  }

  if (notFound.length > 0) {
    return errors.notFound(res, notFound);
  }

  const matchedByCode = await Course.findOne({
    code: code.toLowerCase().trim()
  });
  if (matchedByCode) {
    // There already is a different course with that code
    return errors.duplicate(res, ["code"]);
  }

  let course = new Course({
    code,
    teacher,
    group: matchedGroup._id,
    subject: matchedSubject._id
  });

  course = await course.save();
  course = await Course.populate(course, [
    { path: "teacher", select: "_id label" },
    { path: "subject", select: "code name" },
    { path: "group", select: "code name" }
  ]);

  return res.send(course);
};
