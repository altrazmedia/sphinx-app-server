const express  = require("express");
const router = express.Router();

const { Classes } = require("../models/Classes");
const { Group }   = require("../models/Group");


const asyncMiddleware = require("../middleware/asyncMiddleware");

/**
 * Getting the info of the logged in user
 */
router.get("/", asyncMiddleware(async (req, res) => {

  const user = { ...req.body.__user._doc };

  if (user.role === "teacher") {
    // fetching classes this teacher is leading
    const classesLead = await Classes
      .find({ teacher: user._id })
      .populate("subject", "code name")
      .populate("group", "code name")
      .sort({ active: "desc" })
    
    user.classes_lead = classesLead; 
  }

  if (user.role ===  "student") {
    // fetching classes the user is a part of
    const groups = await Group
      .find({ students: user._id });
    
    
    const classes = await Classes
      .find({ group: { $in: groups.map(group => group._id) }})
      .populate("teacher", "label")
      .populate("subject", "name code")
      .sort({ active: "desc" });
    
    user.my_classes = classes;
  }

  res.send(user);

}));

module.exports = router;