const { Course } = require("../../models/Course");

/** Getting the list of courses the logged in users has created  */
module.exports = async function(req, res) {
  const { __user } = req.body; // Requester

  const courses = await Course.find({ teacher: __user._id })
    .populate("teacher", "label")
    .populate("group", "name code")
    .populate("subject", "name code");

  return res.send(courses);
};
