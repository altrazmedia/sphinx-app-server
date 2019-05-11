const express  = require("express");
const mongoose = require("mongoose");

const { Group } = require("../models/Group");
const { User }  = require("../models/User");
const errors    = require("../utils/errorResponses");

const asyncMiddleware = require("../middleware/asyncMiddleware");
const roles           = require("../middleware/roles");

const router = express.Router();

/** Getting the list of groups */
router.get("/", roles([ "admin", "teacher" ]), asyncMiddleware(async (req, res) => {

  const groups = await Group
    .find()
    .collation({ locale: "en" })
    .sort({ 
      active: "desc",
      name: "asc",
      code: "asc"
    })

  res.send(groups)

}));


/**
 * Creating a new group
 */
router.post("/", roles([ "admin" ]), asyncMiddleware(async (req, res) => {

  const { name, code, students } = req.body;

  const missingFields = [];
  if (!name || typeof name !== "string") { missingFields.push("name"); }
  if (!code || typeof code !== "string") { missingFields.push("code"); }
  if (students && students.constructor !== Array) { missingFields.push("students"); }

  if (missingFields.length > 0) {
    // Some of the required fields are not provided or their type is not valid
    return errors.requiredFields(res, missingFields);
  }


  const matchedByCode = await Group.findOne({ code });
  if (matchedByCode) {
    // There already is a group with that code
    return errors.duplicate(res, [ "code" ]);
  }


  // Filtering only valid students ids
  let studentsIds = !students ? [] : students.filter(id => mongoose.Types.ObjectId.isValid(id));
  // Removing duplicates
  studentsIds = [...new Set(studentsIds) ];

  // Filtering only existing users with "student" role
  const matchedStudents = await User
    .where("_id").in(studentsIds)
    .find({ role: "student" })

  
  let group = new Group({
    name,
    code,
    students: matchedStudents.map(student => student._id) // saving only students ids
  });

  group = await group.save();

  return res.send(group)


}));


/**
 * Getting a single group info
 */
router.get("/:code", roles([ "admin", "teacher" ]), asyncMiddleware(async (req, res) => {

  const { code } = req.params;

  const group = await Group
    .findOne({ code: code.trim().toLowerCase() })
    .populate("students")
  
  if (!group) {
    return errors.notFound(res, [ "group" ]);
  }

  return res.send(group);

}))


/**
 * Editing a group
 */
router.put("/:code", roles([ "admin" ]), asyncMiddleware(async (req, res) => {

  const { active, name, code: code_new } = req.body;
  const { code } = req.params;

  const missingFields = [];
  if (name && typeof name !== "string") { missingFields.push("name"); }
  if (code_new && typeof code_new !== "string") { missingFields.push("code"); }
  if (active !== undefined && typeof active !== "boolean") { missingFields.push("active"); }

  if (missingFields.length > 0) {
    // Some of the required fields are not provided or their type is not valid
    return errors.requiredFields(res, missingFields);
  }

  if (!code) {
    return errors.notFound(res, [ "group" ]);
  }

  if (code_new && code_new.toLowerCase().trim() !== code.toLowerCase().trim()) {
    const matchedByCode = await Group.findOne({ code: code_new.toLowerCase().trim() });
    if (matchedByCode) {
      // There already is a different group with that code
      return errors.duplicate(res, [ "code" ]);
    }
  }


  let group = await Group.findOne({ code: code.toLowerCase().trim() });

  if (!group) {
    return errors.notFound(res, [ "group" ]);
  }
  
  group.name = name || group.name;
  group.code = code_new || group.code;
  group.active = active !== undefined ? active : group.active;

  group = await group.save();

  return res.send( group )

}));


/**
 * Removing the list of students from a group
 */
router.put("/remove-students/:code", roles([ "admin" ]), asyncMiddleware(async (req, res) => {

  const { code } = req.params;
  const { students } = req.body;

  if (!students || students.constructor !== Array) { 
    return errors.requiredFields(res, [ "students" ]);
  }

  if (!code) {
    return errors.notFound(res, [ "group" ]);
  }


  let group = await Group.findOne({ code: code.toLowerCase().trim() });

  if (!group) {
    return errors.notFound(res, [ "group" ]);
  }
  
  // Removing the students from provided list
  group.students = group.students.filter(student => !students.includes(String(student)));
  
  group = await group.save();
  group = await Group.findOne({ code: code.toLowerCase().trim() }).populate("students");

  return res.send(group);

}));


/**
 * Adding the list of students to the group
 */
router.put("/add-students/:code", roles([ "admin" ]), asyncMiddleware(async (req, res) => {

  const { code } = req.params;
  const { students } = req.body;

  if (!students || students.constructor !== Array) { 
    return errors.requiredFields(res, [ "students" ]);
  }
  
  if (!code) {
    return errors.notFound(res, [ "group" ]);
  }

  let group = await Group.findOne({ code: code.toLowerCase().trim() });

  if (!group) {
    return errors.notFound(res, [ "group" ]);
  }

  // Filtering only valid students ids
  let studentsIds = students.filter(id => mongoose.Types.ObjectId.isValid(id));
  
  // Filtering only existing users with "student" role
  const matchedStudents = await User
    .where("_id").in(studentsIds)
    .find({ role: "student" })

  group.students = [ ...new Set([ 
    ...matchedStudents.map(student => String(student._id)), 
    ...group.students.map(student => String(student))
  ])];
  
  group = await group.save();
  group = await Group.findOne({ code: code.toLowerCase().trim() }).populate("students");

  return res.send(group);



}));



module.exports = router;