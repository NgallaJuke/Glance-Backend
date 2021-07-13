const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const ObjectId = require("mongoose").Types.ObjectId;
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const {
  SetUserFeed,
  SetUserHomeFeed,
  SetUserProfil,
  SetPostCache,
  aGetAllPosts,
  aGetUserFeed,
  aGetUserHomeFeed,
  aGetPostCache,
  aGetHasTagPostCache,
  DeletePostsCache,
  aGetUserProfil,
} = require("../utils/RedisPromisify");

// @desc    Create A Post
// @route   GET /api/v1/posts/create
// @access  Private/Tailors
exports.CreatePost = asyncHandler(async (req, res, next) => {
  let picture = [];
  let files = [];
  let error = "";
  if (!req.files || Array.from(req.files.picture).length < 0) {
    return next(new ErrorResponse("Please add a photo", 400));
  }
  // if there is only one file
  if (Array.from(req.files.picture).length === 0) {
    const file = req.files.picture;
    fileCheck(req.user.name, file, (count = 0), picture, error);
    // move the file
    moveFileToPosts_pic(file);
  } else {
    let count = 0;
    // save the files image
    Array.from(req.files.picture).forEach(file => {
      fileCheck(req.user.name, file, count, picture, error);
      count++;
      // move the file
      files.push(file);
    });
    //move all the files to public folder Later cahnge this part to save the file in AWS
    files.forEach(file => {
      moveFileToPosts_pic(file);
    });
  }
  // check if the description has any #(tags) in it
  let tags = [];
  const reg = /#([A-Za-z0-9]+)/g;
  if (JSON.parse(req.body.tags) && req.body.description.match(reg)) {
    const newsTags = JSON.parse(req.body.tags).map(
      tag => "#" + tag.toLowerCase()
    );

    if (req.body.description.match(reg)) {
      tags = [...newsTags, ...req.body.description.match(reg)];
    }
  } else {
    if (req.body.description.match(reg)) {
      tags = [...req.body.description.match(reg)];
    } else if (JSON.parse(req.body.tags)) {
      const newsTags = JSON.parse(req.body.tags).map(
        tag => "#" + tag.toLowerCase()
      );
      tags = [...newsTags];
    }
  }

  if (picture.length === 0)
    return next(new ErrorResponse("Error while uploading the photos", 500));
  try {
    const postOwner = await User.findById(req.user.id);
    if (!postOwner) {
      return next(new ErrorResponse("User not found in DB.", 404));
    }
    // Save the post to the Database
    const post = await Post.create({
      picture,
      description: req.body.description,
      tags,
      user: req.user.id,
      postOwner,
    });
    // Save the post to Redis
    SetPostCache(post.id, post);
    // send the post to the user's followers timeline
    const userRedis = await aGetUserProfil(req.user.name, next);
    if (!userRedis) {
      // if Redis doesn't give back the user then get him from the database
      const userdb = await User.findById(req.user.id);
      if (!userdb) return next(new ErrorResponse("User is not found", 404));
      // Reset the User Profil in Redis in case it was lost
      SetUserProfil(req.user.name, userdb);
      // update user own timeline
      SetUserFeed(userdb.id, post.id);
      // update the user homefeed
      SetUserHomeFeed(userdb.userName, post.id);
      let UserProfil = JSON.parse(userdb);
      const followers = UserProfil.follower;
      if (followers) {
        followers.forEach(follower => {
          // Update the followers's Timeline
          SetUserFeed(follower, post.id);
        });
      }
    } else {
      let UserProfil = JSON.parse(userRedis);
      // update user own timeline
      SetUserFeed(UserProfil._id, post.id);
      // upadate the user homefeed
      SetUserHomeFeed(UserProfil.userName, post.id);
      const followers = UserProfil.follower;
      if (followers) {
        followers.forEach(follower => {
          // Update the followers's Timeline
          SetUserFeed(follower, post.id);
        });
      }
    }

    res.status(200).json({
      type: "success",
      message: "Post created",
      data: post || {},
    });
  } catch (error) {
    res.status(200).json({
      type: "error",
      message: error.message,
      data: {},
    });
  }
});

// @desc    Delete A Post
// @route   DELETE /api/v1/posts/:id/delete
// @access  Private/Tailors
exports.DeletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post)
    return next(
      new ErrorResponse("User not authorize to make this request", 401)
    );
  DeletePostsCache(post.id);
  await post.deleteOne();
  res.status(200).json({
    type: "success",
    message: "Post deleted",
    data: {},
  });
});

// @desc    Get All Posts
// @route   GET /api/v1/auth/posts?limit=
// @access  Public
exports.getAllPosts = asyncHandler(async (req, res, next) => {
  let limit = +req.query.limit;
  if (!limit) {
    limit = "all";
  }
  const discoveredPost = await aGetAllPosts(limit, req.user.id);
  if (discoveredPost) {
    return res.status(200).json({
      type: "success",
      message: "Posts received",
      data: discoveredPost || {},
    });
  } else {
    const posts =
      limit === "all"
        ? await Post.find()
        : await Post.find().sort({ createdAt: -1 }).limit(limit);

    if (!posts)
      return next(
        new ErrorResponse("Posts not found. Or User hase no Post Yet ", 404)
      );
    if (!posts) return next(new ErrorResponse("Posts not found. ", 404));

    return res.status(200).json({
      type: "success",
      message: "Posts received",
      data: posts || {},
    });
  }
});

// @desc    Get All Posts With A Hashtag
// @route   GET /api/v1/auth/posts/hashtags/:hashtag?popular&=limit=
// @access  Private
exports.getHashTagPosts = asyncHandler(async (req, res, next) => {
  const popular = req.query.popular === "true";
  let limit = +req.query.limit;
  if (!limit) {
    limit = "all";
  }
  let postsWithGivenHashtag = [];
  if (popular)
    postsWithGivenHashtag = await Post.find(
      {
        tags: `#${req.params.hashtag}`,
        user: { $ne: req.user.id },
      },
      {
        _id: 1,
      }
    ).sort({ viewedby: 1 });
  else
    postsWithGivenHashtag = await Post.find(
      {
        tags: `#${req.params.hashtag}`,
      },
      {
        _id: 1,
      }
    );

  if (!postsWithGivenHashtag)
    return next(new ErrorResponse("Posts not found. ", 404));

  const posts = await aGetHasTagPostCache(postsWithGivenHashtag, limit);

  return res.status(200).json({
    type: "success",
    message: "Posts hashtag received",
    data: posts || {},
  });
});

// @desc    Get A Post
// @route   GET /api/v1/post/:id
// @access  Public
exports.GetSinglePost = asyncHandler(async (req, res, next) => {
  const post = await aGetPostCache(req.params.id, next);
  if (post) {
    res.status(200).json({
      type: "success",
      message: "Single post received",
      data: JSON.parse(post) || {},
    });
  } else {
    const postdb = await Post.findById(req.params.id);
    if (!postdb) return next(new ErrorResponse("Post not found", 404));
    SetPostCache(req.params.id, postdb);
    return res.status(200).json({
      type: "success",
      message: "Single post received",
      data: postdb || {},
    });
  }
});

// @desc    Get User's Feed
// @route   GET /api/v1/post/timeline
// @access  Private
exports.GetUserFeed = asyncHandler(async (req, res, next) => {
  const userTimeline = await aGetUserFeed(req.user.id, next);
  if (!userTimeline) {
    const posts = await Post.find({ user: req.user.id });
    if (!posts)
      return next(
        new ErrorResponse("Posts not found. Or User hase no Post Yet ", 404)
      );
    // In case this post where not in the cache
    posts.forEach(post => {
      SetPostCache(post.id, post);
      SetUserFeed(req.user.id, post.id);
    });
    res.status(200).json({
      type: "success",
      message: "Timeline received",
      data: posts || {},
    });
  } else {
    res.status(200).json({
      type: "success",
      message: "Timeline received",
      data: userTimeline || {},
    });
  }
});

// @desc    Get User's HomeFeed
// @route   GET /api/v1/post/:userName/home-timeline?limit=
// @access  Private
exports.GetUserHomeFeed = asyncHandler(async (req, res, next) => {
  let limit = +req.query.limit;
  if (!limit) {
    limit = "all";
  }
  const userHomeFeed = await aGetUserHomeFeed(req.params.userName, limit, next);
  //In case the HomeFeed was lost
  if (!userHomeFeed) {
    const posts = await Post.findByUsername(req.params.userName, limit);
    if (!posts)
      return next(
        new ErrorResponse("Posts not found. Or User hase no Post Yet ", 404)
      );
    // In case this post where not in the cache
    posts.forEach(post => {
      SetPostCache(post._id, post);
      SetUserHomeFeed(req.params.userName, post.id);
    });
    return res.status(200).json({
      type: "success",
      message: "Home Timeline received",
      data: posts || {},
    });
  }
  res.status(200).json({
    type: "success",
    message: "Home Timeline received",
    data: userHomeFeed || {},
  });
});

// @desc    Get User's Liked Posts
// @route   GET /api/v1/post//like/:id
// @access  Private
exports.GetUserLikedPost = asyncHandler(async (req, res, next) => {
  const posts = await Post.find({
    user: { $ne: req.params.id },
    "likes.liker": req.params.id,
  });
  if (!posts) return next(new ErrorResponse("Post not found", 404));

  res.status(200).json({
    type: "success",
    message: "Liked posts received",
    data: posts || {},
  });
});

// // @desc    Like A Post
// // @route   PUT /api/v1/post/:id/like
// // @access  Private
exports.LikePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse("Post not found", 404));
  if (
    post.likes.liker.filter(liker => liker.toString() === req.user.id).length >
    0
  )
    return next(new ErrorResponse("Post already liked.", 403));
  post.likes.liker.push(req.user.id);
  post.likes.count++;
  // Update the post in Redis
  SetPostCache(post.id, post);
  //update the post in DB
  await post.save();
  res.status(200).json({
    type: "success",
    message: "Post liked",
    data: post || {},
  });
});

// // @desc    UnLike A Post
// // @route   PUT /api/v1/post/:id/unlike
// // @access  Private
exports.UnlikePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse("Post not found", 404));
  if (
    !post.likes.liker.filter(liker => liker.toString() === req.user.id).length >
    0
  )
    return next(new ErrorResponse("Post not liked.", 403));
  post.likes.liker.pull(req.user.id);
  post.likes.count--;

  // Update the post in Redis
  SetPostCache(post.id, post);
  // update on database
  post.save();
  res.status(200).json({
    type: "success",
    message: "Post disliked",
    data: post || {},
  });
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
  if (user.saved.filter(saved => saved.toString() === req.user.id).length > 0)
    return next(new ErrorResponse("Post already saved.", 403));
  user.saved.push(post.id);
  // update the user in Database
  user.save();
  // update the user in Redis
  SetUserProfil(req.user.name, user);
  res.status(200).json({
    type: "success",
    message: "Post saved",
    data: post || {},
  });
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
  // update the user in Database
  user.save();
  // update the user in Redis
  SetUserProfil(req.user.name, user);
  res.status(200).json({
    type: "success",
    message: "Saved post deleted",
    data: {},
  });
});

/* -----TODO----- */
/* 
  --- Put the comments on redis and link like the post are linked to userTimeline
  --- Gat all Saved Post by a user
 */
/* -------------- */

const fileCheck = (userName, file, count, picture, error) => {
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
  // check file size
  if (file.size > process.env.MAX_PIC_SIZE) {
    error = new ErrorResponse(
      `Please upload an image less than ${process.env.MAX_PIC_SIZE}Mb`,
      400
    );
    return next(error);
  }
  // Create costum file name
  file.name = `post_img[${count}]_${userName}_${Date.now()}${
    path.parse(file.name).ext
  }`;
  picture.push(file.name);
};

const moveFileToPosts_pic = file => {
  file.mv(`${process.env.POSTS_PIC_PATH}/${file.name}`, async err => {
    if (err) {
      return next(
        new ErrorResponse(`Problem while uploading the file ${file.name}`, 500)
      );
    }
  });
};
