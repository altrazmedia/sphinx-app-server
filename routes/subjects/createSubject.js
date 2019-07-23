const { Subject } = require("../../models/Subject");
const errors = require("../../utils/errorResponses");

module.exports = async function(req, res) {
  const { name, code } = req.body;

  const missingFields = [];
  if (typeof name !== "string") {
    missingFields.push("name");
  }
  if (typeof code !== "string") {
    missingFields.push("code");
  }

  if (missingFields.length > 0) {
    // Required fields are missing
    return errors.requiredFields(res, missingFields);
  }

  const matchingSubjects = await Subject.find({ code });
  if (matchingSubjects.length > 0) {
    // There already is a subject with given code
    return errors.duplicate(res, ["code"]);
  }

  let subject = new Subject({ code, name });
  subject = await subject.save();

  return res.send(subject);
};
