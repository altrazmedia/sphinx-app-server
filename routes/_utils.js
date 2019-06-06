const { TestAttempt } = require("../models/TestAttempt");

async function getTestAttempts(testAttemptFindObj, questions, getScores, getQuestionScores = false) {
  let attempts = await TestAttempt
    .find(testAttemptFindObj)
    .populate("student", "label")
    .select("-test");

  attempts = attempts.map(attempt => attempt.toObject());

  if (getScores) {
    // Checking how many questions have been answered correctly
    attempts.forEach(attempt => {

      let correctAnswers = 0; // number of questions user has answered correctly

      attempt.questions.forEach(question => {

        const { questionSchema, answer } = question;
        const correctOptions = questions
          .find(question => String(question._id) === String(questionSchema))
          .options
          .filter(option => option.correct)
          .map(option => option._id)

        if (isAnswerCorrect(answer, correctOptions)) {
          correctAnswers++;
          question.correct = true
        }
        else {
          question.correct = false
        }

      })

      attempt.correctAnswers = correctAnswers;
      attempt.score = Math.floor(100 * 100 * correctAnswers / attempt.questions.length) / 100;
      if (!getQuestionScores) {
        attempt.questions = undefined;
      }

    })
  }

  return attempts

}


/**
 * Checks if user's answer to question is correct
 * @param {Array} answer User's answer
 * @param {Array} correctOptions 
 * @returns {Boolean}
 */
function isAnswerCorrect(answer, correctOptions) {
  answer = answer.map(option => String(option))
  if (correctOptions.length === answer.length) {
    const validOptionsAnswered = correctOptions.filter(option => answer.includes(String(option)));
    if (validOptionsAnswered.length === correctOptions.length) {
      // User has answwered this question correctly
      return true
    }
  }
  return false
}


module.exports = { getTestAttempts, isAnswerCorrect }