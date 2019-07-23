const moment = require("moment");
const { Session } = require("../models/Session");

/** Middleware to check if there is a user logged in */
module.exports = async function(req, res, next) {
  
  const { session_id } = req.headers;

  if(!session_id) {
    return res.status(401).send();
  }

  try {
    const session = await Session
      .findById(session_id)
      .populate("user");

    if (!session) {
      return res.status(401).send();
    }

    if (moment().isSameOrAfter(session.expiry)) {
      // Session has expired
      return res.status(401).send({ reason: "session_expired" });
    }
    
    req.body.__user = session.user;
    next();
  }
  catch(err) {
    return res.status(401).send();
  }
  

  
}