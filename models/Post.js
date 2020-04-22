const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  img_url: [String],
  description: {
    type: String,
    maxlength: 180,
  },
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
