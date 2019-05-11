/**
 * Middleware to check if the user is permitted to perform the request
 * @param {String | Array} roles Required role of list of those
 */
const rolesMiddleware = (roles) => async (req, res, next) => {
  const sendError = () => {
    return res.status(403).send({ required_roles: typeof roles === "string" ? [ roles ] : roles })
  }

  if (!req.body.__user) {
    return sendError();
  }

  const userRole = req.body.__user.role;

  if (typeof roles === "string") {
    if (roles !== userRole) {
      return sendError();
    }
  }
  else {
    if (!roles.includes(userRole)) {
      return sendError();
    }
  }

  next();

}

module.exports = rolesMiddleware;