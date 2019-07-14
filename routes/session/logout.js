const { Session } = require("../../models/Session");
const errors      = require("../../utils/errorResponses");

/**  Logging out - removing the session */
module.exports = async function(req, res) {
  const { session_id } = req.headers;

  const session = await Session.findOneAndDelete({ _id: session_id });
  if (!session) {
    return errors.notFound(res, [ "session" ])
  }

  return res.send();
}