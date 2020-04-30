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
  let count = 0;
  if (!req.files) {
    return next(new ErrorResponse("Please add a photo", 400));
  }

  console.log("req.files", Array.from(req.files.img_url).length);
  if (Array.from(req.files.img_url).length === 0) {
    const file = req.files.img_url;
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
    file.name = `post_img[0]_${Date.now()}${path.parse(file.name).ext}`;

    img_url.push(file.name);
    // move the file
    file.mv(`${process.env.POSTS_PIC_PATH}/${file.name}`, async (err) => {
      if (err) {
        return next(
          new ErrorResponse(
            `Problem while uploading the file ${file.name}`,
            500
          )
        );
      }
    });
  } else {
    // save the files image
    Array.from(req.files.img_url).forEach((file) => {
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
      file.name = `post_img[${count}]_${Date.now()}${
        path.parse(file.name).ext
      }`;
      count++;
      img_url.push(file.name);
      // move the file
      files.push(file);
    });
    if (error) return console.log("Error :", error);

    //move all the files to publis folder
    files.forEach((file) => {
      file.mv(`${process.env.POSTS_PIC_PATH}/${file.name}`, async (err) => {
        if (err) {
          return next(
            new ErrorResponse(
              `Problem while uploading the file ${file.name}`,
              500
            )
          );
        }
      });
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
  const post = await Post.create({
    img_url,
    description: req.body.description,
    tags,
    user: req.user.id,
  });
  res.status(200).json({ success: true, post: post });
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
