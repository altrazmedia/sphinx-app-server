const express = require("express");

const error = require("../middleware/error");
const auth  = require("../middleware/auth");

const subjects = require("../routes/subjects");
const session  = require("../routes/session");
const users    = require("../routes/users");
const groups   = require("../routes/groups");
const classes  = require("../routes/classes");
const tests    = require("../routes/tests");

module.exports = function(app) {
  app.use(express.json());
  
  app.use("/api/subjects", auth);
  app.use("/api/subjects", subjects);

  app.use("/api/session", session);

  app.use("/api/users", auth);
  app.use("/api/users", users);

  app.use("/api/groups", auth);
  app.use("/api/groups", groups);

  app.use("/api/classes", auth);
  app.use("/api/classes", classes);

  app.use("/api/tests", auth);
  app.use("/api/tests", tests);

  app.use(error); // Error middleware
}