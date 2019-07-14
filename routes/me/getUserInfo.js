/** Getting the info of the logged in user  */
module.exports = async function(req, res) {
  const user = { ...req.body.__user._doc };

  res.send(user);
}