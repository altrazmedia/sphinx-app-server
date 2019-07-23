const moment   = require("moment");
const mongoose = require("mongoose");

const { Session } = require("../../models/Session");

/** Checking if the session provided in URL is still valid */
module.exports = async function(req, res) {

  const { session_id } = req.params;

  if(!mongoose.Types.ObjectId.isValid(session_id)) {
    // session_id is not valid
    return res.status(400).send();
  }

  const session = await Session.findById(session_id);

  if (!session || moment().isSameOrAfter(session.expiry)) {
    // There is no session with given id or its expired
    return res.status(400).send();
  }

  return res.status(204).send();
}