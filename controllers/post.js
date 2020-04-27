const mongoose = require("mongoose");
const Post = require("../models/Post");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");

// @desc    Create a Post
// @route   GET /api/v1/post/create-post
// @access  Private
exports.CreatePost = asyncHandler(async (req, res, next) => {
  let img_url = [];
  let files = [];
  let error = "";

  if (!req.files) {
    return next(new ErrorResponse("Please add a photo", 400));
  }

  Array.from(req.files.img_url).forEach((file) => {
    let count = 0;
    // make sure the file is an image
    if (!file.mimetype.startsWith("image")) {
      error = new ErrorResponse("Please upload an image file", 403);
      return next(error);
    } // make sure the image is not a gif
    if (file.mimetype === "image/gif") {
      error = new ErrorResponse("Gif image is not allow", 403);
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
    count++;
    img_url.push(file.name);
    // move the file
    files.push(file);
  });
  if (!error) {
    files.forEach((file) => {
      file.mv(`${process.env.POSTS_PIC_PATH}/${file.name}`, async (err) => {
        if (err) {
          return next(
            new ErrorResponse("Problem while uploading the file", 500)
          );
        }
      });
    });

    const post = await Post.create({
      img_url,
      description: req.body.description,
      user: req.user.id,
    });
    res.status(200).json({ success: true, post: post });
  } else {
    console.log("Error :", error);
  }
});

// @desc    Get A Post
// @route   GET /api/v1/post/:id
// @access  Public
exports.GetSinglePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new ErrorResponse("Post not found", 404));
  }
  res.status(200).json({ success: true, post });
});

// // @desc    Like a Post
// // @route   PUT /api/v1/post/:id/like
// // @access  Private
exports.LikePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) return next(new ErrorResponse("Post not found", 404));

  if (!post.likes.liker.filter((liker) => liker === req.user.id).length > 0) {
    post.likes.liker.push(req.user.id);
    post.likes.count++;
  }
  post.save();

  res.status(200).json({ success: true, post });
});

// // @desc    UnLike a Post
// // @route   PUT /api/v1/post/:id/unlike
// // @access  Private
exports.UnlikePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse("Post not found", 404));

  if (post.likes.liker.filter((liker) => liker === req.user.id).length > 0) {
    post.likes.liker.pull(req.user.id);
    post.likes.count--;
  }
  post.save();

  res.status(200).json({ success: true, post });
});
