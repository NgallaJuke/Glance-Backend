const mongoose = require("mongoose");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.Register = asyncHandler(async (req, res) => {
  // get this variable from the req.body = form registration
  const { email, firstName, lastName, userName, role, password } = req.body;

  // create user
  const user = await User.create({
    email,
    firstName,
    lastName,
    userName,
    role,
    password,
  });

  SendTokentoCokkieResponse(user, 200, res);
});

// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public
exports.Login = asyncHandler(async (req, res, next) => {
  // get this variable from the req.body = form registration
  //check if the email and tha password are provided
  const { email, password } = req.body;
  if (!email || !password)
    return next(
      new ErrorResponse("Please provide and email and a password", 400)
    );

  //find the user with that email
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorResponse("Invalid credentials", 401));

  //Compare the user's password to the user's password saved in the database using the methods created at the User Model
  const pwdMatches = await user.matchPassword(password);
  if (!pwdMatches) return next(new ErrorResponse("Invalid credentials", 401));
  SendTokentoCokkieResponse(user, 200, res);
});

// fonction to create the token send it via cookie to the Headers
const SendTokentoCokkieResponse = async (user, status, res) => {
  //get the token from the methods we created at the User Model: getSignedJWTtoken()
  const token = await user.getSignedJWTtoken();

  //options for the cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOK_EXP * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") options.secure = true;

  res
    .status(status)
    .cookie("token", token, options)
    .json({ success: true, token });
};
