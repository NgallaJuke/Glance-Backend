const mongoose = require("mongoose");

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
    enum: ["costumer", "tailor"],
    default: "costumer",
  },
  createdAt: {
    default: Date.now,
  },
  following: {
    id: String,
  },
});

module.exports = mongoose.model("User", UserSchema);
