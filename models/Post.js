const mongoose = require("mongoose");
const path = require("path");

const PostSchema = new mongoose.Schema({
  img_url: [String],
  description: {
    type: String,
    maxlength: 180,
  },
  likes: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    require: true,
  },
});
module.exports = mongoose.model("Post", PostSchema);
