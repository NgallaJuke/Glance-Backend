const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const ObjectId = require("mongoose").Types.ObjectId;
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const client = require("../utils/redis");
const path = require("path");

// @desc    Create A Post
// @route   GET /api/v1/post/create
// @access  Private/Tailors
exports.CreatePost = asyncHandler(async (req, res, next) => {
  let img_url = [];
  let files = [];
  let error = "";

  if (!req.files || Array.from(req.files.img_url).length < 0) {
    return next(new ErrorResponse("Please add a photo", 400));
  }

  // if there is only one file
  if (Array.from(req.files.img_url).length === 0) {
    const file = req.files.img_url;
    fileCheck(file, (count = 0), img_url, error);
    if (error) return console.log("Error :", error);
    // move the file
    moveFileToPosts_pic(file);
  } else {
    let count = 0;
    // save the files image
    Array.from(req.files.img_url).forEach((file) => {
      fileCheck(file, count, img_url, error);
      count++;
      // move the file
      files.push(file);
    });

    if (error) return console.log("Error :", error);

    //move all the files to public folder
    files.forEach((file) => {
      moveFileToPosts_pic(file);
    });
  }

  // check if the description has any #(tags) in it
  const reg = /#\S+/g;
  let tags = [];
  if (req.body.description.match(reg)) {
    tags = req.body.description.match(reg);
  }

  if (img_url.length === 0)
    return next(new ErrorResponse("Error while uploading the photos", 500));

  try {
    const post = await Post.create({
      img_url,
      description: req.body.description,
      tags,
      user: req.user.id,
    });

    const postKey = `PostId:${post.id}`;
    // console.log("postKey: ", postKey);

    //Caches the post create by the user
    // const postCached = client.set(postKey, JSON.stringify(post));
    // if (!postCached) return next(new ErrorResponse("Error Caching.", 500));

    // client.get(postKey, (err, post) => {
    //   if (err) return next(new ErrorResponse("Error get Cached post.", 500));
    //   console.log("Post:", JSON.parse(post));
    // });

    // Create user's hash timeline
    const userKey = `UserId:${post.user}`;
    const userTimeline = client.hset(userKey, postKey, JSON.stringify(post));
    if (!userTimeline) return next(new ErrorResponse("Error Caching.", 500));

    client.hget(userKey, postKey, (err, userTimeline) => {
      if (err) return next(new ErrorResponse("Error get Cached post.", 500));
      console.log("userTimeline:", JSON.parse(userTimeline));
    });

    res.status(200).json({ success: true, post: post });
  } catch (error) {
    console.log("Error", error);
  }
});

// @desc    Delete A Post
// @route   DELETE /api/v1/post/delete
// @access  Private/Tailors
exports.DeletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findOne({ user: req.user.id });
  if (!post)
    return next(
      new ErrorResponse("User not authorize to make this request", 401)
    );
  post.deleteOne();

  res.status(200).json({ success: true, post: "the Post has been deleted." });
});

// @desc    Get All Posts
// @route   GET /api/v1/auth/post
// @access  Public
exports.getAllPosts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get A Post
// @route   GET /api/v1/post/:id
// @access  Public
exports.GetSinglePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse("Post not found", 404));
  res.status(200).json({ success: true, post });
});

// @desc    Get The User Connected Posts
// @route   GET /api/v1/post/:userName
// @access  Public
exports.GetPostByUser = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ userName: req.params.userName });

  if (!user) return next(new ErrorResponse("User not found", 404));
  const post = await Post.find({ user: user.id });
  if (!post) return next(new ErrorResponse("Post not found", 404));

  res.status(200).json({ success: true, post });
});

// // @desc    Like A Post
// // @route   PUT /api/v1/post/:id/like
// // @access  Private
exports.LikePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) return next(new ErrorResponse("Post not found", 404));

  if (
    post.likes.liker.filter((liker) => liker.toString() === req.user.id)
      .length > 0
  )
    return next(new ErrorResponse("Post already liked.", 403));

  post.likes.liker.push(req.user.id);
  post.likes.count++;

  post.save();

  res.status(200).json({ success: true, post });
});

// // @desc    UnLike A Post
// // @route   PUT /api/v1/post/:id/unlike
// // @access  Private
exports.UnlikePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse("Post not found", 404));

  if (
    !post.likes.liker.filter((liker) => liker.toString() === req.user.id)
      .length > 0
  )
    return next(new ErrorResponse("Post not liked.", 403));
  post.likes.liker.pull(req.user.id);
  post.likes.count--;

  post.save();

  res.status(200).json({ success: true, post });
});

// // @desc    Comment A Post
// // @route   PUT /api/v1/post/:id/comment
// // @access  Private
exports.CommentPost = asyncHandler(async (req, res, next) => {
  // get the post that the connected user comment on
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse("Post not found", 404));

  // check if the description has any #(tags) in it
  const reg = /#\S+/g;
  let tags = [];
  if (req.body.message.match(reg)) {
    tags = req.body.message.match(reg);
  }

  const comment = await Comment.create({
    message: req.body.message,
    tags,
    user: req.user.id,
    post: req.params.id,
  });
  if (!comment)
    return next(new ErrorResponse("Error while creating the comment", 500));

  post.comment.push(comment.id);
  post.save();
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorResponse("User Not Found", 404));
  user.comment.push(comment.id);
  user.save();
  res.status(200).json({ success: true, comment, post, user });
});

// // @desc    Like A Comment
// // @route   PUT /api/v1/post/comment/:id/like
// // @access  Private
exports.LikeComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findById(req.params.id);

  if (!comment) return next(new ErrorResponse("Post not found", 404));

  if (
    !comment.likes.liker.filter((liker) => liker.toString() === req.user.id)
      .length > 0
  ) {
    comment.likes.liker.push(req.user.id);
    comment.likes.count++;
  }
  comment.save();

  res.status(200).json({ success: true, comment });
});

// // @desc    UnLike A Comment
// // @route   PUT /api/v1/post/comment/:id/unlike
// // @access  Private
exports.UnlikeComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findById(req.params.id);
  if (!comment) return next(new ErrorResponse("Comment not found", 404));

  if (
    comment.likes.liker.filter((liker) => liker.toString() === req.user.id)
      .length > 0
  ) {
    comment.likes.liker.pull(req.user.id);
    comment.likes.count--;
  }
  comment.save();

  res.status(200).json({ success: true, comment });
});

// // @desc    Save A Post
// // @route   PUT /api/v1/post/:id/save
// // @access  Private
exports.SavePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse("Post not found.", 404));
  let user = await User.findById(req.user.id);
  if (!user) return next(new ErrorResponse("User not found.", 404));

  if (post.user == user.id) return next(new ErrorResponse("Owned post.", 403));

  if (user.saved.filter((saved) => saved.toString() === req.user.id).length > 0)
    return next(new ErrorResponse("Post already saved.", 403));

  user.saved.push(post.id);
  user.save();
  res.status(200).json({ success: true, post });
});

// // @desc    Delete A Saved Post
// // @route   DELETE /api/v1/post/save/:id/delete
// // @access  Private/Tailor
exports.DeleteSavedPost = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorResponse("User not found.", 404));
  if (!user.saved.includes(req.params.id))
    return next(new ErrorResponse("This post has not been saved.", 404));

  user.saved.pull(req.params.id);
  user.save();
  res
    .status(200)
    .json({ success: true, post: "The saved post has been deleted." });
});

const fileCheck = (file, count, img_url, error) => {
  // make sure the file is an image
  if (!file.mimetype.startsWith("image")) {
    error = new ErrorResponse("Please upload an image file", 403);
    return next(error);
  }
  // make sure the image is not a gif
  if (file.mimetype === "image/gif") {
    error = new ErrorResponse("Gif image is not allow", 403);
    return next(error);
  }
  // make sure the image is not a png
  if (file.mimetype === "image/png") {
    error = new ErrorResponse("PNG image is not allow", 403);
    return next(error);
  }
  // check file size
  if (file.size > process.env.MAX_PIC_SIZE) {
    error = new ErrorResponse(
      `Please upload an image less than ${process.env.MAX_PIC_SIZE}Mb`,
      400
    );
    return next(error);
  }

  // Create costum file name
  file.name = `post_img[${count}]_${Date.now()}${path.parse(file.name).ext}`;
  img_url.push(file.name);
};

const moveFileToPosts_pic = (file) => {
  file.mv(`${process.env.POSTS_PIC_PATH}/${file.name}`, async (err) => {
    if (err) {
      return next(
        new ErrorResponse(`Problem while uploading the file ${file.name}`, 500)
      );
    }
  });
};
