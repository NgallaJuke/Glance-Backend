const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  picture: [{ type: String, require: [true, "Please add photo"] }],
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
  postOwner: {
    type: Object,
    require: [true, "Please add photo"],
  },
  comments: {
    count: { type: Number, default: 0 },
    comment: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Comment",
      },
    ],
  },
});

//Cascade Delete Comments when deleting a Post /// we don't really wont to do that
// PostSchema.pre("remove", async function (next) {
//   console.log("comment and user been remove from post", this._id);

//   await this.model("Comment").deleteMany({ post: this._id });
//   next();
// });
module.exports = mongoose.model("Post", PostSchema);
