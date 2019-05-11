const express  = require("express");
const bcrypt   = require("bcrypt");

const { User }        = require("../models/User");
const { Session }     = require("../models/Session");
const asyncMiddleware = require("../middleware/asyncMiddleware");
const auth            = require("../middleware/auth");

const router = express.Router();

/**
 * Logging in
 */
router.post("/", asyncMiddleware(async (req, res) => {
  const { email, password } = req.body;

  const SESSION_EXPIRY_IN_DAYS = 7;

  const missingFields = [];
  if (!email) { missingFields.push("email"); }
  if (!password) { missingFields.push("password"); }

  if (missingFields.length) {
    // email and/or password was not provided
    return res.status(400).send({ required: missingFields });
  }

  const user = await User
    .findOne({ email })
    .select("+password");
  if (!user) {
    // No user in DB with given email
    return res.status(400).send({ message: "Wrong credentials" });
  } 

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Invalid password
    return res.status(400).send({ message: "Wrong credentials" });
  }


  let session = new Session({ user: user._id, expiry: Date.now() + SESSION_EXPIRY_IN_DAYS * 24 * 60 * 60 * 1000 });
  session = await session.save();

  return res.send({ session_id: session._id, expiry: session.expiry });

}));


/**
 * Logging out - removing the session
 */
router.delete("/", auth, async (req, res) => {

  const { session_id } = req.headers;

  const session = await Session.findOneAndDelete({ _id: session_id });
  if (!session) {
    return res.status(404).send({ notfound: "session" })
  }

  return res.send();
  
})


module.exports = router;