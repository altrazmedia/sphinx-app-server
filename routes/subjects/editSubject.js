const { Subject } = require("../../models/Subject");
const errors = require("../../utils/errorResponses");

module.exports = async function(req, res) {
  const { code } = req.params;
  const { name, code: newCode } = req.body;

  const uncorrectTypes = [];
  if (name && typeof name !== "string") {
    uncorrectTypes.push("name");
  }
  if (newCode && typeof newCode !== "string") {
    uncorrectTypes.push("code");
  }
  if (uncorrectTypes.length > 0) {
    return errors.requiredFields(res, uncorrectTypes);
  }

  if (newCode && newCode.toLowerCase().trim() !== code.toLowerCase().trim()) {
    const subjectByCode = await Subject.findOne({
      code: newCode.toLowerCase().trim()
    });
    if (subjectByCode) {
      // There already is another subject with that code
      return errors.duplicate(res, ["code"]);
    }
  }

  if (!code) {
    return errors.notFound(res, ["subject"]);
  }

  let subject = await Subject.findOne({ code: code.toLowerCase().trim() });
  if (!subject) {
    return errors.notFound(res, ["subject"]);
  }

  subject.name = name || subject.name;
  subject.code = newCode || subject.code;

  subject = await subject.save();

  return res.send(subject);
};
