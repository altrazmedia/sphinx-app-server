const express  = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const roles = require("../../middleware/roles");

const getSubjectsList = require("./getSubjectsList");
const getSubject      = require("./getSubject");
const createSubject   = require("./createSubject");
const editSubject     = require("./editSubject");

const router = express.Router();

router.get("/", asyncMiddleware(getSubjectsList));
router.get("/:code", asyncMiddleware(getSubject));
router.post("/", roles("admin"), asyncMiddleware(createSubject));
router.put("/:code", roles("admin"), asyncMiddleware(editSubject));

module.exports = router;