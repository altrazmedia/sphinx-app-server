const express  = require("express");
const mongoose = require("mongoose");

const { Subject }     = require("../models/Subject");

const asyncMiddleware = require("../middleware/asyncMiddleware");
const auth  = require("../middleware/auth");
const roles = require("../middleware/roles");

const router = express.Router();

/**
 * Getting the list of subjects
 */
router.get("/", asyncMiddleware(async (req, res) => {
  const subjects = await Subject.find().sort("name")
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
 * Getting the subject by id
 */
router.get("/:id", asyncMiddleware(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)){
    return res.status(404).send({ notfound: [ "subject" ] });
  }

  const subject = await Subject.findById(id);
  if (!subject) {
    return res.status(404).send({ notfound: [ "subject" ] });
  }

  return res.send(subject);

}));

/**
 * Editing the subject
 */
router.put("/:id", auth, roles("admin"), asyncMiddleware(async (req, res) => {
  const { id } = req.params;
  const { name, code } = req.body;

  const uncorrectTypes = [];
  if (name && typeof name !== "string") { uncorrectTypes.push("name"); }
  if (code && typeof code !== "string") { uncorrectTypes.push("code"); }
  if (uncorrectTypes.length > 0) {
    return res.status(400).send({ type: uncorrectTypes })
  }

  if (code) {
    const subjectByCode = await Subject.findOne({ code });
    if (subjectByCode && String(subjectByCode._id) !== id) {
      // There already is another subject with that code
      return res.status(409).send({ duplicate: [ "code" ] })
    }
  }
  

  if (!mongoose.Types.ObjectId.isValid(id)){
    return res.status(404).send({ notfound: [ "subject" ] });
  }

  let subject = await Subject.findById(id);
  if (!subject) {
    return res.status(404).send({ notfound: [ "subject" ] });
  }

  subject.name = name || subject.name;
  subject.code = code || subject.code;

  subject = await subject.save();

  return res.send(subject);


}));

module.exports = router;