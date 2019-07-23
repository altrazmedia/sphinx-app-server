const logger = require("../utils/logger");

module.exports = function(err, req, res) {
  logger.error(err.stack);
  res.status(500).end();
};
