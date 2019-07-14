const { Question }   = require("../../models/Question");
const { TestSchema } = require("../../models/TestSchema");
const { Subject }    = require("../../models/Subject");
const errors         = require("../../utils/errorResponses");

/** Creating a new test schema */
module.exports = async function(req, res) {
  const {
    __user, // author of the request
    name, // test name
    description, // test description
    questions, // array of questions
    subject // subject code
  } = req.body;

  const missingFields = [];

  if (!name || typeof name !== "string") { missingFields.push("name"); }
  if (!subject || typeof subject !== "string") { missingFields.push("subject"); }

  if (questions && questions.constructor !== Array) { missingFields.push("questions"); }
  else if (questions) {
    const invalidQuestions = questionsValidation(questions)
    missingFields.push(...invalidQuestions.map(questionNumber => `question-${questionNumber}`))
  }

  if (missingFields.length > 0) {
    return errors.requiredFields(res, missingFields);
  }


  const matchedSubject = await Subject.findOne({ code: subject.toLowerCase().trim() });
  if (!matchedSubject) {
    // There is no subject with given code
    return errors.notFound(res, [ "subject" ]);
  }

  const _questions = await Question.create(questions);

  let test = new TestSchema({
    name,
    description: description ? String(description) : undefined,
    author: __user._id,
    subject: matchedSubject._id,
    questions: _questions.map(question => question._id)
  });

  test = await test.save();
  test = await TestSchema
    .populate(test, [
      { path: "author", select: "label _id" },
      { path: "subject", select: "code name" },
      { path: "questions"}
    ])


  return res.send(test);
}


function questionsValidation(questions) {
  const invalidQuestions = [];
    
  for (let index in questions) {
    const question = questions[index];

    if (!question.content || typeof question.content !== "string") { 
      invalidQuestions.push(Number(index) + 1);
      continue;
    }

    if (!question.options || questions.constructor !== Array) {
      invalidQuestions.push(Number(index) + 1);
      continue;
    }

    let isCorrectAnswer = false; // Checking if there is at least one correct answer
    let isValidOption = true;
    for (let option of question.options) {
      if (!option.content || typeof question.content !== "string" || typeof option.correct !== "boolean") {
        isValidOption = false;
        break;
      }

      if (option.correct === true) {
        isCorrectAnswer = true
      }
    }

    if (!isValidOption || !isCorrectAnswer) { 
      invalidQuestions.push(Number(index) + 1)
    }

  }

  return invalidQuestions;

}