const express = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const roles = require("../../middleware/roles");

const getTestsSchemasList = require("./getTestsSchemasList");
const getTestSchema = require("./getTestSchema");
const createTestSchema = require("./createTestSchema");

const router = express.Router();

router.get("/list", roles(["teacher"]), asyncMiddleware(getTestsSchemasList));
router.get("/single/:id", roles(["teacher"]), asyncMiddleware(getTestSchema));
router.post("/", roles(["teacher"]), asyncMiddleware(createTestSchema));

module.exports = router;
