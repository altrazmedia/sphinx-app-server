// Middleware chechink if the user is permitted to perform the request

const rolesMiddleware = (roles) => async (req, res, next) => {
  const sendError = () => {
    return res.status(403).send({ required_roles: typeof roles === "string" ? [ roles ] : roles })
  }

  if (!req.body.__user) {
    return sendError();
  }

  const userRoles = req.body.__user.roles;

  if (typeof roles === "string") {
    if (!userRoles.includes(roles)) {
      return sendError();
    }
  }
  else {
    if (!userRoles.some(role => roles.includes(role))) {
      return sendError();
    }
  }

  next();

}

module.exports = rolesMiddleware;