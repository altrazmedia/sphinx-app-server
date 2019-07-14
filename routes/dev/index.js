const express  = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const createAdmin     = require("./createAdmin");

const router = express.Router();

router.post("/create-admin", asyncMiddleware(createAdmin));

module.exports = router;