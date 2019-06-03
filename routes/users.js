const express  = require("express");
const mongoose = require("mongoose");
const bcrypt   = require("bcrypt");

const roles           = require("../middleware/roles");
const asyncMiddleware = require("../middleware/asyncMiddleware");

const errors   = require("../utils/errorResponses");
const { User } = require("../models/User");


const router = express.Router();

const availableRoles = [ "admin", "teacher", "student" ];

/**
 * Getting the list of all users
 */
router.get("/", asyncMiddleware(async (req, res) => {

  const users = await User
    .find()
    .collation({ locale: "en" })
    .select("-password")
    .sort({
      active: "desc",
      label: "asc" 
    });
  
  return res.send(users)

}));


/**
 * Adding a new user
 */
router.post("/", roles("admin"), asyncMiddleware(async (req, res) => {

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
}));


/**
 * Getting the single user info
 */
router.get("/:id", roles("admin"), asyncMiddleware(async (req, res) => {

  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)){
    return errors.notFound(res, [ "user" ]);
  }

  const user = await User
    .findById(id)
    .select("-password")

  if (!user) {
    return errors.notFound(res, [ "user" ])
  }

  return res.send(user);
}));


/**
 * Editing the user data
 */
router.put("/:id", roles("admin"), asyncMiddleware(async (req, res) => {

  const { id } = req.params;
  const { label, role, email, active } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)){
    return errors.notFound(res, [ "user" ]);
  }

  const missingFields = [];

  if (label && typeof label !== "string") { missingFields.push("label"); }
  if (role && typeof role !== "string") { missingFields.push("role"); }
  if (email && !isEmailValid(email)) { missingFields.push("email"); }
  if (active !== undefined && typeof active !== "boolean") { missingFields.push("active") }

  if (missingFields.length > 0) {
    return errors.requiredFields(res, missingFields);
  }


  if (!availableRoles.includes(role)) {
    // Provided role is not valid
    return errors.invalidStructure(res, [
      {
        field: "role",
        type: "string",
        enum: availableRoles
      }
    ]);
  }


  if (email) {
    const matchedByEmail = await User.findOne({ email });

    if (matchedByEmail && String(matchedByEmail._id) !== id) {
      // There already is a different user with that email
      return errors.duplicate(res, [ "email" ])
    }

  }


  let user = await User.findById(id);
  if (!user) {
    // User not found
    return errors.notFound(res, [ "user" ])
  }

  if (String(user._id) === String(req.body.__user._id)) {
    // User tries to edit their own data
    return res.status(405).send({
      message: "To edit your own data use `/me` endpoint"
    })

  }



  user.label = label || user.label;
  user.email = email || user.email;
  user.role  = role  || user.role;
  user.active = active !== undefined ? active : user.active;

  user = await user.save();

  return res.send(user.getPublicFields())

}));



/**
 * Checking if given string is a valid email address
 * @param {String} email 
 */
const isEmailValid = email => {
  const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  return typeof email === "string" && reg.test(email);
}

module.exports = router;