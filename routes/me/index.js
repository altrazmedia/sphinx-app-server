const express  = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const getUserInfo     = require("./getUserInfo");

const router = express.Router();

router.get("/", asyncMiddleware(getUserInfo));

module.exports = router;