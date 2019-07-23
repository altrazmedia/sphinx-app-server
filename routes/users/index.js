const express = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const roles = require("../../middleware/roles");

const getUsersList = require("./getUsersList");
const getUser = require("./getUser");
const createUser = require("./createUser");

const router = express.Router();

router.get("/list", asyncMiddleware(getUsersList));
router.get("/single/:id", asyncMiddleware(getUser));
router.post("/", roles("admin"), asyncMiddleware(createUser));

module.exports = router;
