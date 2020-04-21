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
    // make sure the file is an image
    if (!file.mimetype.startsWith("image")) {
      error = new ErrorResponse("Please upload an image file", 403);
      return next(error);
    } // make sure the image is not an gif
    if (file.mimetype === "image/gif") {
      error = new ErrorResponse("Gif image are not allow", 403);
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
    file.name = `avatar_${Date.now()}${path.parse(file.name).ext}`;
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
  }
});
