const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const ObjectId = require("mongoose").Types.ObjectId;
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Make A Comment
// @route   GET /api/v1/comments/:postID/comment
// @access  Private
exports.MakeComment = asyncHandler(async (req, res, next) => {
  const { comment } = req.body;
  // check if the description has any #(tags) in it
  const reg = /#\S+/g;
  let tags = [];
  if (comment.match(reg)) {
    tags = comment.match(reg);
  }
  const commentdb = await Comment.create({
    message: comment,
    tags,
    user: req.user.id,
    post: req.params.postID,
  });
  if (!commentdb)
    return next(
      new ErrorResponse("Internal Error while creating the user", 500)
    );
  res.status(200).json({ success: true, comment: commentdb });
});
