const { Course } = require("../../models/Course");
const { Group } = require("../../models/Group");

/** Getting the list of courses the logged user is part of */
module.exports = async function(req, res) {
  const { __user } = req.body; // Requester

  // Getting the list of groups the user is part of
  const groups = await Group.find({ students: __user._id });

  // Getting the list of courses asigned to user's groups
  const courses = await Course.find({
    group: {
      $in: groups.map(group => group._id)
    }
  })
    .populate("teacher", "label")
    .populate("group", "name code")
    .populate("subject", "name code");

  return res.send(courses);
};
