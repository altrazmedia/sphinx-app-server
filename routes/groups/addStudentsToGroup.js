const mongoose = require("mongoose");

const { Group } = require("../../models/Group");
const { User } = require("../../models/User");
const errors = require("../../utils/errorResponses");

/**
 * Adding the list of students to the group
 */
module.exports = async function(req, res) {
  const { code } = req.params;
  const { students } = req.body;

  if (!students || students.constructor !== Array) {
    return errors.requiredFields(res, ["students"]);
  }

  if (!code) {
    return errors.notFound(res, ["group"]);
  }

  let group = await Group.findOne({ code: code.toLowerCase().trim() });

  if (!group) {
    return errors.notFound(res, ["group"]);
  }

  // Filtering only valid students ids
  const studentsIds = students.filter(id =>
    mongoose.Types.ObjectId.isValid(id)
  );

  // Filtering only existing users with "student" role
  const matchedStudents = await User.where("_id")
    .in(studentsIds)
    .find({ role: "student" });

  group.students = [
    ...new Set([
      ...matchedStudents.map(student => String(student._id)),
      ...group.students.map(student => String(student))
    ])
  ];

  group = await group.save();
  group = await Group.findOne({ code: code.toLowerCase().trim() }).populate(
    "students"
  );

  return res.send(group);
};
