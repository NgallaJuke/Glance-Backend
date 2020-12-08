const mongoose = require("mongoose");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  SetUserProfil,
  GetUserProfil,
  DeleteUserProfil,
} = require("../utils/redis-func");

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.Register = asyncHandler(async (req, res) => {
  // get this variable from the req.body = form registration
  const { email, userName, role, password } = req.body;

  const user = await User.create({
    email,
    userName,
    role,
    password,
  });

  if (!user)
    return next(
      new ErrorResponse("Internal Error while creating the user", 500)
    );

  // Set the UserProfile in the cache
  SetUserProfil(userName, user);

  // create the mail : message and the url to redirect the user
  const fakeToken = user.getRegisterToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/confirm-register/${fakeToken}`;

  console.log("resetURL", resetURL);

  const message = `
  <h2>PLease confirm you registration by making a PUT request to this URL.</h2>\n
  <form
      action="${resetURL}"
      method="post"
    >
      <input type="submit" />
    </form>
  `;

  try {
    await sendEmail({
      email: email,
      subject: "Confirm Registration",
      message,
    });
    res.status(200).json({ success: true, data: "Email sent", user });
  } catch (error) {
    console.log(error);
    next(new ErrorResponse("Email couldn't be sent ", 500));
  }
});

// @desc    Confirm User Registration
// @route   PUT /api/v1/auth/confirm-register/:fakeToken
// @access  Private
exports.ConfirmRegister = asyncHandler(async (req, res, next) => {
  // get hashed token
  const RegisterToken = crypto
    .createHash("sha256")
    .update(req.params.fakeToken)
    .digest("hex");

  const user = await User.findOne({
    RegisterToken,
    confirmRegisterExpire: { $gt: Date.now() },
  });
  if (!user) return next(new ErrorResponse("Invalid", 400));

  user.RegisterToken = undefined;
  user.confirmRegisterExpire = undefined;

  //put the user in the whitelist
  let stream = fs.createWriteStream(
    path.join(__dirname, "../config/whitelist.txt"),
    { flags: "a" }
  );

  stream.write(user.jti + "\n");
  stream.end();
  // save the user
  await user.save();

  // reset the UserProfile in Redis
  SetUserProfil(user.userName, user);

  SendTokentoCookieResponse(user, 200, res);
});

// @desc    Delete User Account
// @route   DELETE /api/v1/auth/users/delete
// @access  Private
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.user.id);
  DeleteUserProfil(req.user.name);
  res.status(200).json({ success: true, data: {} });
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

  // check if the user as confirm is registration
  if (user.RegisterToken)
    return next(
      new ErrorResponse(
        "Please Confirm your registration in the email we sent you",
        401
      )
    );
  if (!user) return next(new ErrorResponse("Invalid credentials", 401));

  //Compare the user's password to the user's password saved in the database using the methods created at the User Model
  const pwdMatches = await user.matchPassword(password);
  if (!pwdMatches) return next(new ErrorResponse("Invalid credentials", 401));

  user.jti = crypto.randomBytes(20).toString("hex");

  await user.save();
  SetUserProfil(user.userName, user);
  let stream = fs.createWriteStream(
    path.join(__dirname, "../config/whitelist.txt"),
    { flags: "a" }
  );
  console.log("Login User", user.jti);

  stream.write(user.jti + "\n");
  stream.end();

  SendTokentoCookieResponse(user, 200, res);
});

// @desc    Logout User
// @route   PUT /api/v1/auth/logout
// @access  Private
exports.Logout = asyncHandler(async (req, res, next) => {
  //find the user with that email
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorResponse("User not found.", 401));

  let whitelist = fs.readFileSync(
    path.join(__dirname, "../config/whitelist.txt"),
    "utf8"
  );

  if (whitelist.includes(user.jti)) {
    let newWhitelist = whitelist.replace(user.jti, "Logged Out");
    fs.writeFileSync(
      path.join(__dirname, "../config/whitelist.txt"),
      newWhitelist,
      "utf-8"
    );
  }

  // delete the jit token secret in the user document
  user.jti = undefined;
  // save the change to database and then to cache
  await user.save();
  SetUserProfil(user.userName, user);

  res.status(200).json({ success: true, message: "User Logged Out." });
});

// @desc    Get Current Logged User
// @route   GET /api/v1/auth/current-user
// @access  Private
exports.CurrentUser = asyncHandler(async (req, res, next) => {
  GetUserProfil(req.user.name, async (err, user) => {
    console.log("USERiD", req.user.id);

    if (err) return next(new ErrorResponse("Error get Cached post.", 500));

    // if the user profil is not in cache then get it from the database
    // and set the user in cache
    if (!user) {
      const user = await User.findById(req.user.id);
      if (!user) return next(new ErrorResponse("The User is not found", 404));
      SetUserProfil(user.userName, user);
      res.status(200).json({ success: true, UserProfil: user });
      return;
    }
    let UserProfil = JSON.parse(user);
    res.status(200).json({ success: true, UserProfil });
  });
});

// @desc    Forgot Password
// @route   GET /api/v1/auth/forget-password
// @access  Private
exports.ForgetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new ErrorResponse("No user with that email found", 404));

  // get the reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // create reset URL
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/forget-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested to reset off a password.\n Please make a PUT request to: \n\n ${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Password rest Token",
      message,
    });
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    next(new ErrorResponse("Email couldn't be sent ", 500));
  }
});

// @desc    Reset Password
// @route   PUT /api/v1/auth/forget-password/:resetToken
// @access  Public
exports.ResetPassword = asyncHandler(async (req, res, next) => {
  // get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) return next(new ErrorResponse("Invalid", 400));

  // Set new password
  user.password = req.body.password;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // save the user
  await user.save();

  // reset the UserProfile in Redis
  SetUserProfil(user.userName, user);

  SendTokentoCookieResponse(user, 200, res);
});

/* ------------------------------------------------------ */

// fonction to create the token send it via cookie to the Headers
const SendTokentoCookieResponse = async (user, status, res) => {
  //get the token from the methods we created at the User Model: getSignedJWTtoken()
  const token = await user.getSignedJWTtoken();

  //options for the cookie
  // process.env.JWT_COOK_EXP is in Day so trun in into ms
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
    .header("Authorization", "Bearer " + token)
    .json({ success: true, token });
};
