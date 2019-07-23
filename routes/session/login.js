const bcrypt   = require("bcrypt");
const moment   = require("moment");

const { User }    = require("../../models/User");
const { Session } = require("../../models/Session");
const errors      = require("../../utils/errorResponses");


const SESSION_EXPIRY_IN_DAYS = 7;

/** Logging in */
module.exports = async function(req, res) {
  const { email, password } = req.body;

  const missingFields = [];
  if (!email) { missingFields.push("email"); }
  if (!password) { missingFields.push("password"); }

  if (missingFields.length) {
    // email and/or password was not provided
    return errors.requiredFields(res, missingFields);
  }

  const user = await User
    .findOne({ email })
    .select("+password");
  if (!user) {
    // No user in DB with given email
    return res.status(400).send({ message: "Wrong credentials", reason: "wrong_credentials" });
  } 

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Invalid password
    return res.status(400).send({ message: "Wrong credentials", reason: "wrong_credentials" });
  }

  const expirationDate = moment().add(SESSION_EXPIRY_IN_DAYS, "d").utc().toJSON(); // session expiration date (UTC)

  let session = new Session({ user: user._id, expiry: expirationDate });
  session = await session.save();

  return res.send({ session_id: session._id, expiry: session.expiry });
}