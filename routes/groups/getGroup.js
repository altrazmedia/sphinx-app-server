const { Group } = require("../../models/Group");
const { Course } = require("../../models/Course");
const errors = require("../../utils/errorResponses");

/**
 * Getting a single group info
 */
module.exports = async function(req, res) {
  const { code } = req.params;

  let group = await Group.findOne({ code: code.trim().toLowerCase() }).populate(
    "students"
  );

  if (!group) {
    return errors.notFound(res, ["group"]);
  }

  group = group.toObject();

  // Finding cuorses assigned to this group
  const matchedCourses = await Course.find({ group: group._id })
    .select("teacher subject code")
    .populate("teacher")
    .populate("subject");

  group.courses = matchedCourses;

  return res.send(group);
};
