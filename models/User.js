const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const path = require("path");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  firstName: {
    type: String,
    maxlength: 30,
    required: [true, "Please add your firstname"],
  },
  lastName: {
    type: String,
    maxlength: 30,
    required: [true, "Please add your lastName"],
  },
  userName: {
    type: String,
    maxlength: 30,
    unique: [true, "this username is already exist"],
    required: [true, "Please add your userName"],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    maxlength: 20,
    select: false,
  },
  role: {
    type: String,
    required: [true, "Please choose a user type"],
    enum: ["costumer", "tailor"],
    default: "costumer",
  },
  avatar: {
    type: String,
    default: path.join(__dirname + "../../public/avatars/default.png"),
  },
  follower: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  comment: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Comment",
    },
  ],
  blocked: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  blockedBy: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  saved: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Post",
    },
  ],

  resetPasswordToken: String,
  resetPasswordExpire: Date,
  RegisterToken: String,
  confirmRegisterExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});
/* ----------------NOTE------------------- */
/*
const user = new User.create({...})
....... user.createToken

-STATICS are called in the model itself -> here create is a STATIC
-METHODS are called in what you initialize on the model 
  or get from the model -> createToken is a methode
*/
/* ----------------------------------- */

// incrypt password using bcript
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();

  // gen the salt
  const salt = await bcrypt.genSalt(10);
  //hash the password
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT an return
UserSchema.methods.getSignedJWTtoken = function () {
  // return the Token we create from the secret code and times' expiration
  return jwt.sign({ id: this._id }, process.env.JWT_SCRT, {
    expiresIn: process.env.JWT_EXP,
  });
};

// Check if the user entered password Matches to the hashed password in the database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password Token
UserSchema.methods.getResetPasswordToken = function () {
  // generate Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // hash the token and set to reserPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// Generate and hash register Token
UserSchema.methods.getRegisterToken = function () {
  // generate Token
  const fakeToken = crypto.randomBytes(20).toString("hex");

  // hash the token and set to RegisterToken field
  this.RegisterToken = crypto
    .createHash("sha256")
    .update(fakeToken)
    .digest("hex");

  // set expire
  this.confirmRegisterExpire = Date.now() + 10 * 60 * 1000;
  return fakeToken;
};

module.exports = mongoose.model("User", UserSchema);
