const express = require("express");
const logger  = require("./utils/logger");

const config  = require("./setup/config");
const db      = require("./setup/db");
const routes  = require("./setup/routes");

const app = express();

config();
db();
routes(app);

const port = process.env.PORT || 3001;
app.listen(port, () => logger.info(`Listening on port ${port}...`))