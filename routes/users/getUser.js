const mongoose = require("mongoose");

const errors = require("../../utils/errorResponses");
const { User } = require("../../models/User");

/** Getting the single user info */
module.exports = async function(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errors.notFound(res, ["user"]);
  }

  const user = await User.findById(id).select("-password");

  if (!user) {
    return errors.notFound(res, ["user"]);
  }

  return res.send(user);
};
