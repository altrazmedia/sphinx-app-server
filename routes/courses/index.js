const express = require("express");

const asyncMiddleware = require("../../middleware/asyncMiddleware");
const roles = require("../../middleware/roles");

const getCoursesList = require("./getCoursesList");
const getCourse = require("./getCourse");
const createCourse = require("./createCourse");
const getMyCourses = require("./getMyCourses");
const getMyLeadCourses = require("./getMyLeadCourses");

const router = express.Router();

router.get("/", roles(["teacher", "admin"]), asyncMiddleware(getCoursesList));
router.get("/single/:code", asyncMiddleware(getCourse));
router.post("/", roles(["admin"]), asyncMiddleware(createCourse));
router.get("/my", asyncMiddleware(getMyCourses));
router.get("/my-lead", asyncMiddleware(getMyLeadCourses));

module.exports = router;
