const express = require("express");

const error   = require("../middleware/error");
const auth    = require("../middleware/auth");
const logger  = require("../middleware/logger");

const subjects     = require("../routes/subjects");
const session      = require("../routes/session");
const users        = require("../routes/users");
const groups       = require("../routes/groups");
const courses      = require("../routes/courses");
const testsSchemas = require("../routes/testsSchemas");
const tests        = require("../routes/tests");
const me           = require("../routes/me");

module.exports = function(app) {
  app.use(express.json());
  app.use(logger);
  
  app.use("/api/session", session);
  
  app.use("/api/me", auth);
  app.use("/api/me", me);
  
  app.use("/api/subjects", auth);
  app.use("/api/subjects", subjects);

  app.use("/api/users", auth);
  app.use("/api/users", users);

  app.use("/api/groups", auth);
  app.use("/api/groups", groups);

  app.use("/api/courses", auth);
  app.use("/api/courses", courses);

  app.use("/api/testsSchemas", auth);
  app.use("/api/testsSchemas", testsSchemas);

  app.use("/api/tests", auth);
  app.use("/api/tests", tests);

  app.use(error); // Error middleware
}