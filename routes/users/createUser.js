const bcrypt   = require("bcrypt");

const errors   = require("../../utils/errorResponses");
const { User } = require("../../models/User");

const availableRoles = [ "admin", "teacher", "student" ];

/** Creating a new user */
module.exports = async function(req, res) {
  const { email, label, role, password } = req.body;

  const missingFields = [];

  if (!isEmailValid(email)) { missingFields.push("email"); }
  if (!label || typeof label !== "string") { missingFields.push("label"); }
  if (!password || typeof password !== "string") { missingFields.push("password"); }
  if (!role || typeof role !== "string") { missingFields.push("role"); }

  if (missingFields.length > 0) {
    // Not all required fields were provided or their type isn't valid
    return errors.requiredFields(res, missingFields);
  }

  const structureErrors = [];

  if (password.length < 5 || password.length > 50) {
    // Provided password is too short or too long
    structureErrors.push({
      field: "password",
      type: "string",
      min_length: 5,
      max_length: 50
    })
  }

  if (label.length < 5 || label.length > 50) {
    // Provided label is too short or too long
    structureErrors.push({
      field: "label",
      type: "string",
      min_length: 3,
      max_length: 40
    })
  }

  if (!availableRoles.includes(role)) {
    // Provided role is not valid
    structureErrors.push({
      field: "role",
      type: "string",
      enum: availableRoles
    })
  }

  if (structureErrors.length > 0) {
    return errors.invalidStructure(res, structureErrors);
  }



  // Checking if there already is a user with that email address
  const matchedByEmail = await User.findOne({ email });
  if (matchedByEmail) {
    return errors.duplicate(res, [ "email" ])
  }


  // Hashing the password
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  

  // Creating the user
  let user = new User({
    email, 
    label,
    password: hashed,
    role
  })

  user = await user.save();

  return res.send(user.getPublicFields())
}

/**
 * Checking if given string is a valid email address
 * @param {String} email 
 */
const isEmailValid = email => {
  const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  return typeof email === "string" && reg.test(email);
}
