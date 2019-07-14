const { Subject } = require("../../models/Subject");
const errors      = require("../../utils/errorResponses");


module.exports = async function(req, res) {
  const { code } = req.params;

  if (!code) {
    return errors.notFound(res, [ "subject" ])
  }

  const subject = await Subject.findOne({ code: code.toLowerCase().trim() });
  if (!subject) {
    return errors.notFound(res, [ "subject" ])
  }

  return res.send(subject);
}