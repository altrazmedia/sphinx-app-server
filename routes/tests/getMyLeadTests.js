const { Course } = require("../../models/Course");
const { Test } = require("../../models/Test");
const errors = require("../../utils/errorResponses");

/** Getting the list of tests user is leading  */
module.exports = async function(req, res) {
  const { __user } = req.body;
  const { course } = req.query; // Course code; if provided, only tests assigned to this course will be returned

  let findObj;

  if (course) {
    const matchedCourse = await Course.findOne({
      code: course,
      teacher: __user._id
    });
    if (!matchedCourse) {
      return errors.notFound(res, ["course"]);
    }
    findObj = { course: matchedCourse._id };
  } else {
    const courses = await Course.find({ teacher: __user._id }); // list of courses the logged user is teaching
    findObj = {
      course: {
        $in: courses.map(item => item._id)
      }
    };
  }

  const tests = await Test.find(findObj)
    .select("course testSchema start end status")
    .populate("course")
    .populate("testSchema", "name");

  return res.send(tests);
};
