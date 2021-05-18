const mongoose = require("mongoose");
const User = require("./User");
const Post = require("./Post");

const CommentSchema = new mongoose.Schema({
  comment: { type: String, require: [true, "Comment must have text contend"] },

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

CommentSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    await Post.updateOne(
      { _id: this.post },
      {
        $pull: { "comments.comment": this._id },
        $inc: { "comments.count": -1 },
      },
      { new: true, runValidators: true }
    );
    await User.updateOne(
      { _id: this.user },
      {
        $pull: { "comments.comment": this._id },
        $inc: { "comments.count": -1 },
      },
      { new: true, runValidators: true }
    );
    next();
  }
);

module.exports = mongoose.model("Comment", CommentSchema);
