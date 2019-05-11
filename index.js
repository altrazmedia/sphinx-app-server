const express = require("express");
const cors    = require("cors");

const logger  = require("./utils/logger");

const config  = require("./setup/config");
const db      = require("./setup/db");
const routes  = require("./setup/routes");

const app = express();

app.use(cors());
config();
db();
routes(app);

const port = process.env.PORT || 3001;
app.listen(port, () => logger.info(`Listening on port ${port}...`))