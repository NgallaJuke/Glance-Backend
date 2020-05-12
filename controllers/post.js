const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const ObjectId = require("mongoose").Types.ObjectId;
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");

// @desc    Create A Post
// @route   GET /api/v1/post/create
// @access  Private/Tailors
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
    user: req.user,
  });
  res.status(200).json({ success: true, post: post });
});

// @desc    Delete A Post
// @route   DELETE /api/v1/post/delete
// @access  Private/Tailors
exports.DeletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findOne({ user: req.user });
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
// // @route   PUT /api/v1/post/like
// // @access  Private
exports.LikePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.body.id);

  if (!post) return next(new ErrorResponse("Post not found", 404));

  if (
    post.likes.liker.filter((liker) => liker.toString() === req.user).length > 0
  )
    return next(new ErrorResponse("Post already liked.", 403));

  post.likes.liker.push(req.user);
  post.likes.count++;

  post.save();

  res.status(200).json({ success: true, post });
});

// // @desc    UnLike A Post
// // @route   PUT /api/v1/post/unlike
// // @access  Private
exports.UnlikePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.body.id);
  if (!post) return next(new ErrorResponse("Post not found", 404));

  if (
    !post.likes.liker.filter((liker) => liker.toString() === req.user).length >
    0
  )
    return next(new ErrorResponse("Post not liked.", 403));
  post.likes.liker.pull(req.user);
  post.likes.count--;

  post.save();

  res.status(200).json({ success: true, post });
});

// // @desc    Comment A Post
// // @route   PUT /api/v1/post/comment
// // @access  Private
exports.CommentPost = asyncHandler(async (req, res, next) => {
  // get the post that the connected user comment on
  const post = await Post.findById(req.body.id);
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
    user: req.user,
    post: req.body.id,
  });
  if (!comment)
    return next(new ErrorResponse("Error while creating the comment", 500));

  post.comment.push(comment.id);
  post.save();
  const user = await User.findById(req.user);
  if (!user) return next(new ErrorResponse("User Not Found", 404));
  user.comment.push(comment.id);
  user.save();
  res.status(200).json({ success: true, comment, post, user });
});

// // @desc    Like A Comment
// // @route   PUT /api/v1/post/comment/like
// // @access  Private
exports.LikeComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findById(req.body.id);

  if (!comment) return next(new ErrorResponse("Post not found", 404));

  if (
    !comment.likes.liker.filter((liker) => liker.toString() === req.user)
      .length > 0
  ) {
    comment.likes.liker.push(req.user);
    comment.likes.count++;
  }
  comment.save();

  res.status(200).json({ success: true, comment });
});

// // @desc    UnLike A Comment
// // @route   PUT /api/v1/post/comment/unlike
// // @access  Private
exports.UnlikeComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findById(req.body.id);
  if (!comment) return next(new ErrorResponse("Comment not found", 404));

  if (
    comment.likes.liker.filter((liker) => liker.toString() === req.user)
      .length > 0
  ) {
    comment.likes.liker.pull(req.user);
    comment.likes.count--;
  }
  comment.save();

  res.status(200).json({ success: true, comment });
});

// // @desc    Save A Post
// // @route   PUT /api/v1/post/save
// // @access  Private
exports.SavePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.body.id);
  if (!post) return next(new ErrorResponse("Post not found.", 404));
  let user = await User.findById(req.user);
  if (!user) return next(new ErrorResponse("User not found.", 404));

  if (user.saved.filter((saved) => saved.toString() === req.user).length > 0)
    return next(new ErrorResponse("Post already saved.", 403));

  user.saved.push(post.id);
  user.save();
  res.status(200).json({ success: true, post });
});

// // @desc    Delete A Saved Post
// // @route   DELETE /api/v1/post/save/delete
// // @access  Private/Tailor
exports.DeleteSavedPost = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user);
  if (!user) return next(new ErrorResponse("User not found.", 404));
  if (!user.saved.includes(req.body.id))
    return next(new ErrorResponse("This post has not been saved.", 404));

  user.saved.pull(req.body.id);
  user.save();
  res
    .status(200)
    .json({ success: true, post: "The saved post has been deleted." });
});
