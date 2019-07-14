const { Subject } = require("../../models/Subject");

module.exports = async function(req, res) {
  const subjects = await Subject
    .find()
    .sort("name");

  res.send(subjects);
}

