const { Group } = require("../../models/Group");
const errors = require("../../utils/errorResponses");

/**
 * Editing the name and code of a group
 */
module.exports = async function(req, res) {
  const { name, code: code_new } = req.body;
  const { code } = req.params;

  const missingFields = [];
  if (name && typeof name !== "string") {
    missingFields.push("name");
  }
  if (code_new && typeof code_new !== "string") {
    missingFields.push("code");
  }

  if (missingFields.length > 0) {
    // Some of the required fields are not provided or their type is not valid
    return errors.requiredFields(res, missingFields);
  }

  if (!code) {
    return errors.notFound(res, ["group"]);
  }

  if (code_new && code_new.toLowerCase().trim() !== code.toLowerCase().trim()) {
    const matchedByCode = await Group.findOne({
      code: code_new.toLowerCase().trim()
    });
    if (matchedByCode) {
      // There already is a different group with that code
      return errors.duplicate(res, ["code"]);
    }
  }

  let group = await Group.findOne({ code: code.toLowerCase().trim() });

  if (!group) {
    return errors.notFound(res, ["group"]);
  }

  group.name = name || group.name;
  group.code = code_new || group.code;

  group = await group.save();

  return res.send(group);
};
