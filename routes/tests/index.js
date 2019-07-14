const express  = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const roles = require("../../middleware/roles");

const createTest        = require("./createTest");
const getTest           = require("./getTest");
const getMyTests        = require("./getMyTests");
const getMyLeadTests    = require("./getMyLeadTests");
const answerTheQuestion = require("./answerTheQuestion");

const router = express.Router();

router.post("/", roles([ "teacher" ]), asyncMiddleware(createTest));
router.get("/single/:id", asyncMiddleware(getTest));
router.get("/my", asyncMiddleware(getMyTests));
router.get("/my-lead", asyncMiddleware(getMyLeadTests));
router.put("/answer/:test_id/:question_id", roles("student"), asyncMiddleware(answerTheQuestion));

module.exports = router;