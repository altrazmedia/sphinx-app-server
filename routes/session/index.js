const express = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const auth = require("../../middleware/auth");

const login = require("./login");
const logout = require("./logout");
const checkSession = require("./checkSession");

const router = express.Router();

router.post("/", asyncMiddleware(login));
router.delete("/", auth, asyncMiddleware(logout));
router.get("/:session_id", asyncMiddleware(checkSession));

module.exports = router;
