const express  = require("express");
const mongoose = require("mongoose");

const { Group }   = require("../models/Group");
const { Classes } = require("../models/Classes");
const { Subject } = require("../models/Subject");
const { User }    = require("../models/User");
const errors      = require("../utils/errorResponses");

const asyncMiddleware = require("../middleware/asyncMiddleware");
const roles           = require("../middleware/roles");

const router = express.Router();

// TODO: Editing the classes


/**
 * Getting the classes list
 */
router.get("/", roles([ "teacher", "admin" ]), asyncMiddleware(async (req, res) => {

  const classes = await Classes
    .find()
    .populate("teacher", "_id label")
    .populate("group", "code name")
    .populate("subject", "code name")
    .sort({
      active: "desc",
      name: "asc",
      code: "asc"
    });

  return res.send(classes);

}));


/**
 * Adding the new classes
 */
router.post("/", roles([ "admin" ]), asyncMiddleware(async (req, res) => {

  const { 
    teacher,  // User id
    group,    // Group code
    subject,  // Subject code
    code      // unique classes code
  } = req.body;

  const missingFields = [];
  if (!code || typeof code !== "string") { missingFields.push("code"); }
  if (!group || typeof group !== "string") { missingFields.push("group"); }
  if (!subject || typeof subject !== "string") { missingFields.push("subject"); }
  if (!teacher || !mongoose.Types.ObjectId.isValid(teacher)) { missingFields.push("teacher"); }


  if (missingFields.length > 0) {
    // Some of the required fields are not provided or their type is not valid
    return errors.requiredFields(res, missingFields);
  }


  const notFound = [];
  
  const matchedGroup    = await Group.findOne({ code: group.toLowerCase().trim(), active: true });
  if (!matchedGroup) { notFound.push("group"); }

  const matchedSubject  = await Subject.findOne({ code: subject.toLowerCase().trim(), active: true });
  if (!matchedSubject) { notFound.push("subject"); }

  const matchedTeacher = await User.findOne({ _id: teacher.trim(), active: true, roles: "teacher" });
  if (!matchedTeacher) { notFound.push("teacher"); }


  if (notFound.length > 0) {
    return errors.notFound(res, notFound);
  }


  const matchedByCode = await Classes.findOne({ code: code.toLowerCase().trim() });
  if (matchedByCode) {
    // There already is a different class with that code
    return errors.duplicate(res, [ "code" ]);
  }


  let classes = new Classes({
    code,
    teacher,
    group: matchedGroup._id,
    subject: matchedSubject._id
  });

  classes = await classes.save();
  classes = await Classes
    .populate(classes, [
      { path: "teacher", select: "_id label" },
      { path: "subject", select: "code name" },
      { path: "group", select: "code name" },
    ])


  return res.send(classes)
  


}));



module.exports = router;