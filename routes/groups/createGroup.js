const mongoose = require("mongoose");

const { Group } = require("../../models/Group");
const { User } = require("../../models/User");
const errors = require("../../utils/errorResponses");

/**
 * Creating a new group
 */
module.exports = async function(req, res) {
  const { name, code, students } = req.body;

  const missingFields = [];
  if (!name || typeof name !== "string") {
    missingFields.push("name");
  }
  if (!code || typeof code !== "string") {
    missingFields.push("code");
  }
  if (students && students.constructor !== Array) {
    missingFields.push("students");
  }

  if (missingFields.length > 0) {
    // Some of the required fields are not provided or their type is not valid
    return errors.requiredFields(res, missingFields);
  }

  const matchedByCode = await Group.findOne({ code });
  if (matchedByCode) {
    // There already is a group with that code
    return errors.duplicate(res, ["code"]);
  }

  // Filtering only valid students ids
  let studentsIds = !students
    ? []
    : students.filter(id => mongoose.Types.ObjectId.isValid(id));
  // Removing duplicates
  studentsIds = [...new Set(studentsIds)];

  // Filtering only existing users with "student" role
  const matchedStudents = await User.where("_id")
    .in(studentsIds)
    .find({ role: "student" });

  let group = new Group({
    name,
    code,
    students: matchedStudents.map(student => student._id) // saving only students ids
  });

  group = await group.save();

  return res.send(group);
};
