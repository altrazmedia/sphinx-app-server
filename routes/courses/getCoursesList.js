const { Course } = require("../../models/Course");

/** Getting the list of all courses */
module.exports = async function(req, res) {
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
}