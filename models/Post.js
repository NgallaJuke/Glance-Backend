const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  img_url: [{ type: String, require: [true, "Please add photo"] }],
  description: {
    type: String,
    maxlength: 180,
  },
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
});
module.exports = mongoose.model("Post", PostSchema);
