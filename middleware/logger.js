const logger = require("../utils/logger");

module.exports = function(req, res, next) {
  logger.info({ path: req.path })
  next();
}