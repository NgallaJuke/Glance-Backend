const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const ObjectId = require("mongoose").Types.ObjectId;
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const { SetPostCache } = require("../utils/RedisPromisify");

// @desc    Make A Comment
// @route   POST /api/v1/comments/:postID/comment
// @access  Private
exports.MakeComment = asyncHandler(async (req, res, next) => {
  const { comment } = req.body;
  // check if the description has any #(tags) in it
  const reg = /#\S+/g;
  let tags = [];
  if (comment.match(reg)) tags = comment.match(reg);
  const commentdb = await Comment.create({
    comment,
    tags,
    user: req.user.id,
    post: req.params.postID,
  });
  if (!commentdb)
    return next(
      new ErrorResponse("Internal Error while creating the user", 500)
    );
  //update the post in Database and in Redis
  const postdb = await Post.findOneAndUpdate(
    { _id: req.params.postID },
    {
      $push: { "comments.comment": commentdb.id },
      $inc: { "comments.count": 1 },
    },
    { new: true, runValidators: true }
  );
  if (!postdb)
    return next(
      new ErrorResponse("Internal Error while updating the post", 500)
    );
  await SetPostCache(postdb.id, postdb);

  res.status(200).json({
    type: "success",
    message: "Comment created",
    data: commentdb || {},
  });
});

// @desc    Get All Comment From A Post
// @route   GET /api/v1/comments/:postID/comment/all
// @access  Private
exports.GetAllPostComments = asyncHandler(async (req, res, next) => {
  //get the post and populate all the comments
  const post = await Post.findOne({ _id: req.params.postID }).populate(
    "comments.comment"
  );

  if (!post)
    return next(
      new ErrorResponse("Internal Error while getting comments", 500)
    );

  const comment = await Comment.find()
    .where("_id")
    .in(post.comments.comment)
    .populate("user", "avatar userName");

  // add the user id to Post collection viewedBy field & update in on the cache
  // await post.updateOne({
  //   $addToSet: { viewedBy: req.user.id },
  // });

  // since the viewedBy must only have unique value, we have to push a Set on the post document and not an Array
  post.viewedBy.push(req.user.id);
  const newViewer = [...new Set(post.viewedBy)];
  post.viewedBy = newViewer;

  await post.save();
  await SetPostCache(post.id, post);

  res.status(200).json({
    type: "success",
    message: "Comments received",
    data: comment || {},
  });
});

// @desc    Delete A Comment
// @route   DEL /api/v1/comments/:postID/delete/:commentID
// @access  Private
exports.DeleteComment = asyncHandler(async (req, res, next) => {
  //delete the post in Database and in Redis
  let comment = await Comment.findById(req.params.commentID);
  if (!comment)
    return next(
      new ErrorResponse("Internal Error Comment Not found In DB", 500)
    );
  await comment.deleteOne();
  const postdb = await Post.findById(req.params.postID);
  if (!postdb)
    return next(new ErrorResponse("Internal Error Post Not Found In DB", 500));
  await SetPostCache(postdb.id, postdb);

  res.status(200).json({
    type: "success",
    message: "Comment deleted",
    data: {},
  });
});

// @desc    Like A Comment
// @route   DEL /api/v1/comments/:postID/like/:commentID
// @access  Private
exports.LikeComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findOneAndUpdate(
    { _id: req.params.commentID },
    {
      $push: { "likes.liker": req.user.id },
      $inc: { "likes.count": 1 },
    },
    { new: true, runValidators: true }
  );
  if (!comment)
    return next(
      new ErrorResponse("Internal Error Comment Not found In DB", 500)
    );

  const postdb = await Post.findById(req.params.postID);
  if (!postdb)
    return next(new ErrorResponse("Internal Error Post Not Found In DB", 500));
  await SetPostCache(postdb.id, postdb);

  res.status(200).json({
    type: "success",
    message: "Comment liked",
    data: {},
  });
});

// @desc    Dislike A Comment
// @route   DEL /api/v1/comments/:postID/dislike/:commentID
// @access  Private
exports.DislikeComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findOneAndUpdate(
    { _id: req.params.commentID },
    {
      $pull: { "likes.liker": req.user.id },
      $inc: { "likes.count": -1 },
    },
    { new: true, runValidators: true }
  );
  if (!comment)
    return next(
      new ErrorResponse("Internal Error Comment Not found In DB", 500)
    );

  const postdb = await Post.findById(req.params.postID);
  if (!postdb)
    return next(new ErrorResponse("Internal Error Post Not Found In DB", 500));
  await SetPostCache(postdb.id, postdb);

  res.status(200).json({
    type: "success",
    message: "Comment disliked",
    data: {},
  });
});
