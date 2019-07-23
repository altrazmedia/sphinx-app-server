const winston = require("winston");

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.Console({ level: "error" }),
    new winston.transports.Console({ level: "info" }),
    new winston.transports.File({
      filename: "logs/logfile.log",
      level: "info"
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
    new winston.transports.Console()
  ]
});

module.exports = logger;
