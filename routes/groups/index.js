const express  = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const roles           = require("../../middleware/roles");

const getGroupsList           = require("./getGroupsList");
const getGroup                = require("./getGroup");
const createGroup             = require("./createGroup");
const editGroup               = require("./editGroup");
const removeStudentsFromGroup = require("./removeStudentsFromGroup");
const addStudentsToGroup      = require("./addStudentsToGroup");

const router = express.Router();

router.get("/", roles([ "admin", "teacher" ]), asyncMiddleware(getGroupsList));
router.get("/:code", roles([ "admin", "teacher" ]), asyncMiddleware(getGroup));
router.post("/", roles([ "admin" ]), asyncMiddleware(createGroup));
router.put("/:code", roles([ "admin" ]), asyncMiddleware(editGroup));
router.put("/remove-students/:code", roles([ "admin" ]), asyncMiddleware(removeStudentsFromGroup));
router.put("/add-students/:code", roles([ "admin" ]), asyncMiddleware(addStudentsToGroup));


module.exports = router;