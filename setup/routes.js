const express = require("express");

const error = require("../middleware/error");
const subjects = require("../routes/subjects");

module.exports = function(app) {
  app.use(express.json());

  app.use("/api/subjects", subjects);

  app.use(error); // Error middleware
}