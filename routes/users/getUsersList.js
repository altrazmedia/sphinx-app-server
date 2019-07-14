const { User } = require("../../models/User");

/**  Getting the list of all users */
module.exports = async function(req, res) {

  const users = await User
  .find()
  .collation({ locale: "en" })
  .select("-password")
  .sort({ label: "asc" });

  return res.send(users)

}