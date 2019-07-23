const { Group } = require("../../models/Group");

/** Getting the list of groups */
module.exports = async function(req, res) {
  const groups = await Group.find()
    .collation({ locale: "en" })
    .select("-students")
    .sort({
      name: "asc",
      code: "asc"
    });

  res.send(groups);
};
