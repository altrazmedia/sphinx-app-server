const mongoose = require("mongoose");
const logger = require("../utils/logger");

module.exports = function() {
  // Connect to Mongo
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => logger.info("Connected to MongoDB..."));
};
