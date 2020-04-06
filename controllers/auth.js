const mongoose = require("mongoose");
const User = require("../models/User");

// @desc   Register User
// @route   GET /api/v1/auth/register
// @access  Public
exports.Register = async (req, res) => {
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

  const token = await user.getSignedJWTtoken();
  res.status(200).json({ success: true, token });
};
