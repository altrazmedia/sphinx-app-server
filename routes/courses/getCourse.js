const { Course } = require("../../models/Course");
const { Test }   = require("../../models/Test");
const errors     = require("../../utils/errorResponses");

const { getTestAttempts } = require("../tests/_utils");

/** Getting the single course info */
module.exports = async function(req, res) {
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
}