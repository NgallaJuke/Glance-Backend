const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  message: { type: String, require: [true, "Comment must have text contend"] },

  tags: [String],
  likes: {
    count: { type: Number, default: 0 },
    liker: [String],
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
  post: {
    type: mongoose.Schema.ObjectId,
    ref: "Post",
    require: true,
  },
});
module.exports = mongoose.model("Comment", CommentSchema);
