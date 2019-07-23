const { Group } = require("../../models/Group");

const errors = require("../../utils/errorResponses");

/**
 * Removing the list of students from a group
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

  // Removing the students from provided list
  group.students = group.students.filter(
    student => !students.includes(String(student))
  );

  group = await group.save();
  group = await Group.findOne({ code: code.toLowerCase().trim() }).populate(
    "students"
  );

  return res.send(group);
};
