const { TestSchema }    = require("../../models/TestSchema");

/** Getting the list of all tests schemas */
module.exports = async function(req, res) {
  // Finding by subject id if 'subject' query param is provided
  const findObj = req.query.subject ? 
    { subject: req.query.subject } : {};
  
  const tests = await TestSchema
    .find(findObj)
    .populate("subject", "code name")
    .populate("author", "label")

  return res.send(tests);
}