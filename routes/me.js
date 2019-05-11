const express  = require("express");
const router = express.Router();


const asyncMiddleware = require("../middleware/asyncMiddleware");

/**
 * Getting the info of the logged in user
 */
router.get("/", asyncMiddleware(async (req, res) => {

  const user = { ...req.body.__user._doc };

  res.send(user);

}));

module.exports = router;