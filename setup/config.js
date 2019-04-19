const dotenv = require("dotenv");

module.exports = function () {
  dotenv.config();

  process.on("unhandledRejection", ex => {
    throw ex;
  })

  if (!process.env.MONGO_URL) {
    throw new Error("`MONGO_URL` has to be defined")
  }


}