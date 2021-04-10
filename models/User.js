const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const { kMaxLength } = require("buffer");

/* 
TODO: 
 
 - Add Tags ( what he is doing like which style he is working on... related to the Tags When Creating a Post)
 - Add Location, Phone Number  
 - Add Social Media 
*/
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
  userName: {
    type: String,
    maxlength: 30,
    unique: [true, "this userName is already exist"],
    required: [true, "Please add your userName"],
  },
  displayName: {
    type: String,
    maxlength: 30,
  },
  bio: {
    type: String,
    maxlength: 150,
  },
  about_user: {
    type: String,
    maxlength: 500,
  },
  interest: [String],
  socials: [
    {
      twitter: { type: String },
      facebook: { type: String },
      instagram: { type: String },
      github: { type: String },
      linkedin: { type: String },
      dribbble: { type: String },
      behance: { type: String },
    },
  ],
  password: {
    type: String,
    required: [true, "Please add a password"],
    select: false,
  },
  role: {
    type: String,
    required: [true, "Please choose a user type"],
    enum: ["costumer", "tailor"],
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
  comments: {
    count: { type: Number, default: 0 },
    comment: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Comment",
      },
    ],
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  jti: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  RegisterToken: String,
  confirmRegisterExpire: Date,
});
/* ----------------NOTE------------------- */
/*
const user = new User.create({...})
....... user.createToken

-STATICS are called in the model itself -> here create is a STATIC -> create is a static 
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
  this.user_secret = crypto.randomBytes(20).toString("hex");
  this.jti = crypto.randomBytes(20).toString("hex");
});

// Sign JWT an return
UserSchema.methods.getSignedJWTtoken = function () {
  // return the Token we create from the secret code and times' expiration
  return jwt.sign(
    {
      sub: this.id,
      jti: this.jti,
      role: this.role,
      name: this.userName,
    },
    process.env.JWT_SCRT,
    {
      expiresIn: process.env.JWT_EXP,
    }
  );
};

// Check if the user entered password Matches to the hashed password in the database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); //this referes to the user instance using this methode
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
// This Token is for the the url sent to a new registered user
// Will help for aking sur that this url confirmation is for this particular user
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
