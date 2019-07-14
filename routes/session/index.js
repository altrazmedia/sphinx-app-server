const express  = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const auth            = require("../../middleware/auth");

const login  = require("./login");
const logout = require("./logout");

const router = express.Router();

router.post("/", asyncMiddleware(login));
router.delete("/", auth, asyncMiddleware(logout));

module.exports = router;
