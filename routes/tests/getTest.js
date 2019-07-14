const mongoose = require("mongoose");

const { Test }        = require("../../models/Test");
const { TestAttempt } = require("../../models/TestAttempt");
const errors          = require("../../utils/errorResponses");

const { isAnswerCorrect, getTestAttempts } = require("./_utils");


/** Getting the single test data */
module.exports = async function(req, res) {
  const { id } = req.params;
  const { __user } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return errors.notFound(res, [ "test" ]);
  }


  let test = await Test
    .findById(id)
    .populate({
      path: "course",
      populate: { path: "subject teacher group" }
    })
    .populate("testSchema", "name description")
    .populate("questions")


  if (!test) {
    return errors.notFound(res, [ "test" ])
  }

  test = test.toObject();
  test.my_access = "none";

  if (String(test.course.teacher._id) === String(__user._id)) {
    // User is leading this test
    test.my_access = "teacher";
    const attempts = await getTestAttempts({ test: id }, test.questions, test.status === "finished")
    test.attempts = attempts;

  } 

  else if (__user.role === "student") { 

    if (!test.students.map(student => String(student)).includes(String(__user._id))) {
      // Student is not taking a part in this test
      return res.status(403).send();
    }

    test.my_access = "student";

    if (test.status === "ongoing" || test.status === "finished") {

      let attempt = await TestAttempt.findOne({ student: __user._id, test: id }); // Finding user's attempt to this test
      attempt = attempt.toObject();

      attempt.questions.forEach(question => {
        const { questionSchema } = question;
        const matchedQuestion = test.questions.find(question => String(question._id) === String(questionSchema));
        question.content = matchedQuestion.content;
        question.options = matchedQuestion.options.map(option => ({ 
          content: option.content, 
          _id: option._id,
          correct: test.status === "finished" ? option.correct : undefined
        })); 

        if (test.status === "finished") {
          // Test is finished - checking if the procided answer is correct
          const correctOptions = matchedQuestion.options.filter(option => option.correct).map(option => option._id);
          question.correct = isAnswerCorrect(question.answer, correctOptions);
        }

      })

      if (test.status === "finished") {
        // Calculating the score
        attempt.correctAnswers = attempt.questions.filter(question => question.correct).length;
        attempt.score = Math.floor(100 * 100 * attempt.correctAnswers / attempt.questions.length) / 100;
      }


      test.my_attempt = attempt;

    }

    test.questions = undefined;

  }

  res.send(test)
}