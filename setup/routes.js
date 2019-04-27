const express = require("express");

const error = require("../middleware/error");
const auth  = require("../middleware/auth");

const subjects = require("../routes/subjects");
const session  = require("../routes/session");

module.exports = function(app) {
  app.use(express.json());
  
  app.use("/api/subjects", auth);
  app.use("/api/subjects", subjects);

  app.use("/api/session", session);

  app.use(error); // Error middleware
}