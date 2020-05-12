const jwt = require("jsonwebtoken");
const User = require("../models/User");
const CryptoJS = require("crypto-js");
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
  } else if (req.cookie.tpken) {
    token = req.cookie.token;
  }

  // check if the token is here
  if (!token) next(new ErrorResponse("Not authorize to acces this route", 401));

  try {
    // get the header,payload and signature part from the token
    const tkn = token.split(".");
    let header = tkn[0];
    let payload = tkn[1];
    let signature = tkn[2];

    //decode base64 the header and do some verifications
    let headerArray = CryptoJS.enc.Base64.parse(header);
    let objHeader = JSON.parse(headerArray.toString(CryptoJS.enc.Utf8));
    if (
      objHeader.alg === "none" ||
      objHeader.alg !== "HS256" ||
      objHeader.typ !== "JWT"
    )
      return next(
        new ErrorResponse(
          "GO BACK TO THE SHADOW.\nYoooooooouuuuuu Shhhaaaallllllll Noooooot Paaaaaaasssssssssss !!!!!!!",
          403
        )
      );

    //decode base64 the payload and do some verifications and query the user
    let payloadArray = CryptoJS.enc.Base64.parse(payload);
    let objPayload = JSON.parse(payloadArray.toString(CryptoJS.enc.Utf8));

    if (
      !objPayload.sub ||
      !objPayload.iat ||
      !objPayload.exp ||
      !objPayload.jti
    )
      return next(
        new ErrorResponse(
          "GO BACK TO THE SHADOW.\nYoooooooouuuuuu Shhhaaaallllllll Noooooot Paaaaaaasssssssssss !!!!!!!",
          403
        )
      );

    if (Date.now() > objPayload.exp)
      return next(new ErrorResponse("Token Expired.", 403));

    const user = await User.findById(objPayload.sub);
    if (!user) return next(new ErrorResponse("User not found.", 401));
    if (!user.jti || user.jti === undefined || user.jti === null)
      next(new ErrorResponse("Connect to access this route", 401));

    const base64urlSignature = CryptoJS.HmacSHA256(
      header + "." + payload,
      process.env.JWT_SCRT,
      objPayload.jti
    )
      .toString(CryptoJS.enc.Base64)
      .replace(/\+/g, "-")
      .replace(/\=+$/m, "");

    if (base64urlSignature !== signature)
      return next(new ErrorResponse("Signature does not match. ", 403));
    req.user = user;

    next();
  } catch (error) {
    return next(new ErrorResponse("An Error Occured", 500));
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
