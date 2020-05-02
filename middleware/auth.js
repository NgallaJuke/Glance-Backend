const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

exports.Protect = asyncHandler(async (req, res, next) => {
  let token;
  // check if the authorization header is set and take the token in it Esle get the Token from the cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } /*  else if (req.cookie.tpken) {
    token = req.cookie.token;
  } */

  // check if the token is here
  if (!token) next(new ErrorResponse("Not authorize to acces this route", 401));

  try {
    // verify the token
    const decoded = jwt.verify(token, process.env.JWT_SCRT);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return next(new ErrorResponse("Not authorize to acces this route", 401));
  }
});

// Grant access to specific roles
exports.Authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new ErrorResponse(
        `User's role (${req.user.role}) is not authorized to access this route.`,
        403
      )
    );
  }
  return next();
};
