const express  = require("express");
const mongoose = require("mongoose");

const { Subject } = require("../models/Subject");
const errors      = require("../utils/errorResponses");

const asyncMiddleware = require("../middleware/asyncMiddleware");
const auth  = require("../middleware/auth");
const roles = require("../middleware/roles");

const router = express.Router();

/**
 * Getting the list of subjects
 */
router.get("/", asyncMiddleware(async (req, res) => {

  const subjects = await Subject
    .find()
    .sort("name");

  res.send(subjects);
}));


/**
 * Creating a new subject
 */
router.post("/", auth, roles("admin"), asyncMiddleware(async (req, res) => {
  const { name, code } = req.body;

  const missingFields = [];
  if (typeof name !== "string") { missingFields.push("name"); }
  if (typeof code !== "string") { missingFields.push("code"); }

  if (missingFields.length > 0) {
    // Required fields are missing
    return res.status(400).send({ required: missingFields })
  }

  const matchingSubjects = await Subject.find({ code });
  if (matchingSubjects.length > 0) {
    // There already is a subject with given code
    return res.status(409).send({ duplicate: [ "code" ] })
  }
  
  let subject = new Subject({ code, name });
  subject = await subject.save();

  return res.send(subject);

}));


/**
 * Getting the subject by code
 */
router.get("/:code", asyncMiddleware(async (req, res) => {
  const { code } = req.params;

  if (!code) {
    return errors.notFound(res, [ "subject" ])
  }

  const subject = await Subject.findOne({ code: code.toLowerCase().trim() });
  if (!subject) {
    return errors.notFound(res, [ "subject" ])
  }

  return res.send(subject);

}));

/**
 * Editing the subject
 */
router.put("/:code", auth, roles("admin"), asyncMiddleware(async (req, res) => {
  const { code } = req.params;
  const { name, code: newCode } = req.body;

  const uncorrectTypes = [];
  if (name && typeof name !== "string") { uncorrectTypes.push("name"); }
  if (newCode && typeof newCode !== "string") { uncorrectTypes.push("code"); }
  if (uncorrectTypes.length > 0) {
    return errors.requiredFields(res, uncorrectTypes);
  }

  if (newCode && newCode.toLowerCase().trim() !== code.toLowerCase().trim()) {
    const subjectByCode = await Subject.findOne({ code: newCode.toLowerCase().trim() });
    if (subjectByCode) {
      // There already is another subject with that code
      return errors.duplicate(res, [ "code" ])
    }
  }
  

  if (!code){
    return errors.notFound(res, [ "subject" ]);
  }

  let subject = await Subject.findOne({ code: code.toLowerCase().trim() });
  if (!subject) {
    return errors.notFound(res, [ "subject" ]);
  }

  subject.name = name || subject.name;
  subject.code = newCode || subject.code;

  subject = await subject.save();

  return res.send(subject);


}));

module.exports = router;