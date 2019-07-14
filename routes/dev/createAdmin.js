const bcrypt   = require("bcrypt");

const { User } = require("../../models/User");

/** Creating the admin account */
module.exports = async function(req, res) {
  const email = "admin@test.pl";
  const password = "admin";


  const admin = await User.findOne({ email })
  if (admin) {
    return res.status(409).send({
      message: "There already is a test admin account"
    })
  }

  
  // Hashing the password
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  // Creating the user
  let user = new User({
    email, 
    label: "Test Admin",
    password: hashed,
    role: "admin"
  })

  user = await user.save();

  return res.send({
    message: "Test admin account has been created!",
    email,
    password
  })
}