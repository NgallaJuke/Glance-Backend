const mongoose = require("mongoose");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const {
  SetUserProfil,
  aGetUserProfil,
  DeleteUserProfil,
} = require("../utils/RedisPromisify");

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.Register = asyncHandler(async (req, res, next) => {
  // trim all the value of the req.body
  Object.keys(req.body).map(
    k =>
    (req.body[k] =
      typeof req.body[k] == "string" ? req.body[k].trim() : req.body[k])
  );
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
  // create the mail : message and the url to redirect the user
  const fakeToken = user.getRegisterToken();

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/confirm-register/${fakeToken}`;

  const message = `
  <h2>Please confirm you registration.</h2>\n
  <form 
      target="_blank"
      action="${resetURL}"
      method="post"
    >
      <input style='padding: 10px 20px;
  background-color: dodgerblue;
  border: 1px solid #ddd;
  color: white;
  cursor: pointer;' type="submit" value="Confirm" />
    </form>
  `;
  try {
    await sendEmail({
      email: email,
      subject: "Confirm Registration",
      message,
    });

    // Set the UserProfile in the cache
    SetUserProfil(userName, user);
    //"validateBeforeSave" if set to true will run a validation before the user is saved to the database and not if set to false
    await user.save({ validateBeforeSave: true });
    res.status(200).json({
      type: "success",
      message:
        "Registration successful. Please check your email to confirm your registration!",
      data: {},
    });
  } catch (error) {
    console.log(error);
    next(new ErrorResponse("Email could not be sent", 500));
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
  SendTokentoCookieResponse(user, true, 200, res);
});

// @desc    Delete User Account
// @route   DELETE /api/v1/auth/users/delete
// @access  Private
exports.DeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorResponse("Invalid credentials", 401));
  await user.deleteOne();
  DeleteUserProfil(req.user.name);
  res.status(200).json({
    type: "success",
    message: "User Deleted Succesfully",
    data: {},
  });
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
  if (!user) return next(new ErrorResponse("Invalid credentials", 401));
  if (user.RegisterToken)
    return next(
      new ErrorResponse(
        "Please Confirm your registration in the email we sent you",
        401
      )
    );

  //Compare the user's password to the user's password saved in the database using the methods created at the User Model
  const pwdMatches = await user.matchPassword(password);
  if (!pwdMatches) return next(new ErrorResponse("Invalid credentials", 401));
  user.jti = crypto.randomBytes(20).toString("hex");
  await user.save();
  SetUserProfil(user.userName, user);

  //save the user's jti to the whitelist. The Whitelist registers all the online users
  let stream = fs.createWriteStream(
    path.join(__dirname, "../config/whitelist.txt"),
    { flags: "a" }
  );
  stream.write(user.jti + "\n");
  stream.end();

  SendTokentoCookieResponse(user, false, 200, res);
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
  res.status(200).json({
    type: "success",
    message: "User Logged Out",
    data: {},
  });
});

// @desc    Get Current Logged User
// @route   GET /api/v1/auth/current-user
// @access  Private
exports.CurrentUser = asyncHandler(async (req, res, next) => {
  const user = await aGetUserProfil(req.user.name, next);
  console.log('user1', user);

  if (user) {
    res.status(200).json({
      type: "success",
      message: "User received from cache",
      data: user || {},
    });
  } else {
    const user = await User.findById(req.user.id);
    console.log('user2', user);
    if (!user) return next(new ErrorResponse("The User is not found", 404));
    SetUserProfil(user.userName, user);
    res.status(200).json({
      type: "success",
      message: "User received from cache",
      data: user || {},
    });
  }
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
    res.status(200).json({
      type: "success",
      message: "Email sent",
      data: {},
    });
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

  SendTokentoCookieResponse(user, false, 200, res);
});

// @desc    Change Password
// @route   PUT /api/v1/auth/change-password
// @access  Private
exports.ChangePassword = asyncHandler(async (req, res, next) => {
  // get hashed token
  const user = await User.findById(req.user.id).select("+password");
  if (!user) return next(new ErrorResponse("The User is not found", 404));
  // Set new password
  let { oldPassword, newPassword } = req.body;
  const pwdMatches = await user.matchPassword(oldPassword);
  //find if the current passord or old password match to the saved user's one
  if (!pwdMatches)
    return next(new ErrorResponse("Current Password Not Valid", 401));
  user.password = newPassword;
  await user.save(); //the pre.save methode on the user's Schema will hash the new password
  // reset the UserProfile in Redis
  SetUserProfil(user.userName, user);
  res.status(200).json({
    type: "success",
    message: "Password changed",
    data: user || {},
  });
});

/* ------------------------------------------------------ */

// fonction to create the token send it via cookie to the Headers
const SendTokentoCookieResponse = async (
  user,
  newUser = false,
  status,
  res
) => {
  //get the token from the methods we created at the User Model: getSignedJWTtoken()
  const token = await user.getSignedJWTtoken();
  //options for the cookie
  // process.env.JWT_COOK_EXP is in Day so we turns it into ms
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOK_EXP * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") options.secure = true;

  if (newUser) {
    res
      .status(status)
      .cookie("token", token, options)
      .header("Authorization", "Bearer " + token)
      .redirect(`${process.env.FRONTEND_URI}?token=${token}`);
  } else {
    res
      .status(status)
      .cookie("token", token, options)
      .header("Authorization", "Bearer " + token)
      .json({ success: true, token });
  }
};
