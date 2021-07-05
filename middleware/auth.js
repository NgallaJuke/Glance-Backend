const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const path = require("path");
const fs = require("fs");

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
    let decoded = jwt.decode(token, { complete: true });

    if (
      decoded.header.alg === "none" ||
      decoded.header.alg !== "HS256" ||
      decoded.header.typ !== "JWT"
    )
      return next(new ErrorResponse("Token Header Unvalid.", 401));

    if (
      !decoded.payload.sub ||
      !decoded.payload.iat ||
      !decoded.payload.exp ||
      !decoded.payload.role ||
      !decoded.payload.jti
    )
      return next(new ErrorResponse("Token Payload Unvalid.", 401));

    if (Date.now() / 1000 > decoded.payload.exp)
      return next(new ErrorResponse("Token Expired.", 401));

    let whitelist = fs.readFileSync(
      path.join(__dirname, "../config/whitelist.txt"),
      "utf8"
    );

    if (!whitelist.includes(decoded.payload.jti))
      return next(new ErrorResponse("Connect to access this route", 401));

    // verify the token
    const validToken = jwt.verify(token, process.env.JWT_SCRT);
    if (!validToken) return next(new ErrorResponse("Token Unvalid.", 401));
    req.user = {
      id: decoded.payload.sub,
      role: decoded.payload.role,
      name: decoded.payload.name,
    };
    next();
  } catch (error) {
    return next(error);
  }
});

// Grant access to specific roles
exports.Authorize =
  (...roles) =>
  (req, res, next) => {
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
