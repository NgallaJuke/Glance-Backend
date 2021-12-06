const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const {
  SetUserProfil,
  aGetUserProfil,
  aGetAllUserProfil,
} = require("../utils/RedisPromisify");

// @desc    Get All Users
// @route   GET /api/v1/users
// @access  Private
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await aGetAllUserProfil(req.user.name);
  console.log(`users`, users);
  if (users) {
    res.status(200).json({
      type: "success",
      message: "Users received",
      data: users || {},
    });
  } else {
    const users_from_db = await User.find();
    if (!users_from_db) {
      return next(new ErrorResponse("User not found in DB.", 404));
    }
    users_from_db.forEach(user => {
      SetUserProfil(user.userName, user);
    });
    res.status(200).json({
      type: "success",
      message: "Users received",
      data: users_from_db || {},
    });
  }
});

// @desc    Get A User
// @route   GET /api/v1/users/:userName
// @access  Public
exports.GetSingleUser = asyncHandler(async (req, res, next) => {
  const user = await aGetUserProfil(req.params.userName, next);
  if (user) {
    res.status(200).json({
      type: "success",
      message: "User received",
      data: user || {},
    });
  } else {
    const user_from_db = await User.findOne({ userName: req.params.userName });
    if (!user_from_db) {
      return next(new ErrorResponse("User not found in DB.", 404));
    }
    SetUserProfil(user_from_db.userName, user_from_db);
    res.status(200).json({
      type: "success",
      message: "User received",
      data: user_from_db || {},
    });
  }
});

// @desc    Get A User in DB
// @route   GET /api/v1/users/user/:id
// @access  Public
exports.GetSingleUserInDB = asyncHandler(async (req, res, next) => {
  const user_from_db = await User.findById(req.params.id);
  if (!user_from_db) {
    return next(new ErrorResponse("User not found in DB.", 404));
  }
  res.status(200).json({
    type: "success",
    message: "User received",
    data: user_from_db || {},
  });
});

// @desc    Get All User's Followers
// @route   GET /api/v1/users/all-follower/:id
// @access  Public
exports.getAllFollower = asyncHandler(async (req, res, next) => {
  // const user = await aGetUserProfil(req.params.id);
  // if (user) {
  //   const followers = user.follower.map(async person => {
  //     await aGetUserProfil(person, next);
  //   });

  //   res.status(200).json({
  //     type: "success",
  //     message: "User's followers received from cache",
  //     data: followers || {},
  //   });
  // } else {
  const user_from_db = await User.findById(req.params.id).populate("follower");
  if (!user_from_db) {
    return next(new ErrorResponse("User not found in DB.", 404));
  }
  res.status(200).json({
    type: "success",
    message: "User's followers received from db",
    data: user_from_db.follower || {},
  });
  // }
});

// @desc    Get All User's Following
// @route   GET /api/v1/users/all-following/:id
// @access  Public
exports.getAllFollowing = asyncHandler(async (req, res, next) => {
  const user_from_db = await User.findById(req.params.id).populate("following");
  if (!user_from_db) {
    return next(new ErrorResponse("User not found in DB.", 404));
  }
  console.log("user_from_db.following", user_from_db.following);

  res.status(200).json({
    type: "success",
    message: "User following received from db",
    data: user_from_db.following || {},
  });
});

// @desc    Follow a User
// @route   PUT /api/v1/users/:id/follow
// @access  Private
exports.FollowUser = asyncHandler(async (req, res, next) => {
  if (req.user.id === req.params.id)
    return next(new ErrorResponse("User can not follow itself.", 403));
  //get the id of the user that we follow
  let followed = await User.findById(req.params.id);
  if (!followed)
    return next(new ErrorResponse("Followed user not found.", 404));

  if (
    followed.follower.filter(follower => follower.toString() === req.user.id)
      .length > 0
  )
    return next(new ErrorResponse("User already followed.", 403));

  if (
    followed.blockedBy.filter(blocker => blocker.toString() === req.user.id)
      .length > 0
  )
    return next(
      new ErrorResponse("User is Blocked so can't be followed.", 403)
    );

  followed = await User.findByIdAndUpdate(
    req.params.id,
    { $push: { follower: req.user.id } },
    { new: true, runValidators: true }
  );
  // set the followed user a UserProfil cache
  SetUserProfil(followed.userName, followed);

  let user = await User.findByIdAndUpdate(
    req.user.id,
    { $push: { following: req.params.id } },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!user) return next(new ErrorResponse("User Not Found.", 404));
  // set the follower user a UserProfil cache
  SetUserProfil(req.user.name, user);
  res.status(200).json({
    type: "success",
    message: "User unfollowed",
    data: [followed, user] || [],
  });
});

// @desc    Unfollow a User
// @route   PUT /api/v1/users/:id/unfollow
// @access  Private
exports.UnfollowUser = asyncHandler(async (req, res, next) => {
  if (req.user.id === req.params.id)
    return next(new ErrorResponse("User can not unfollow itself."));
  //get the id of the user that we unfollow
  let unfollowed = await User.findById(req.params.id);
  let user = await User.findById(req.user.id);
  if (!unfollowed || !user)
    return next(new ErrorResponse("User not found", 404));
  // check if the connected user is following this user
  if (
    user.following.filter(following => following.toString() === req.params.id)
      .length === 0
  )
    return next(new ErrorResponse("User is not followed", 403));
  //delete the connected user to this user's follower list
  unfollowed = await User.findByIdAndUpdate(
    req.params.id,
    { $pull: { follower: req.user.id } },
    { new: true, runValidators: true }
  );
  // set the followed user a UserProfil cache
  SetUserProfil(unfollowed.userName, unfollowed);
  //delete the unfollowed user to the connected user's following list
  user = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { following: req.params.id } },
    {
      new: true,
      runValidators: true,
    }
  );
  // set the follower user a UserProfil cache
  SetUserProfil(req.user.name, user);
  res.status(200).json({
    type: "success",
    message: "User unfollowed",
    data: [unfollowed, user] || [],
  });
});

// @desc    Block a User
// @route   PUT /api/v1/users/:id/block
// @access  Private
exports.BlockUser = asyncHandler(async (req, res, next) => {
  if (req.user.id === req.params.id)
    return next(new ErrorResponse("User can not block itself."));
  //get the id of the user that we block
  let blocked = await User.findById(req.params.id);
  if (!blocked) return next(new ErrorResponse("Blocked User not found", 404));
  if (
    blocked.blockedBy.filter(blocker => blocker.toString() === req.user.id)
      .length > 0
  )
    return next(new ErrorResponse("User already blocked", 403));
  let user = await User.findById(req.user.id);
  // check if the user exist
  if (!user) return next(new ErrorResponse("User Not Found", 404));
  blocked = await User.findByIdAndUpdate(
    req.params.id,
    {
      $push: { blockedBy: req.user.id },
      $pull: { following: req.user.id },
      $pull: { follower: req.user.id },
    },
    { new: true, runValidators: true }
  );
  SetUserProfil(blocked.userName, user);
  user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $push: { blocked: req.params.id },
      $pull: { follower: req.params.id },
      $pull: { following: req.params.id },
    },
    { new: true, runValidators: true }
  );
  SetUserProfil(req.user.name, user);
  res.status(200).json({
    type: "success",
    message: "User blocked",
    data: [blocked, user] || [],
  });
});

// @desc    Unblock a User
// @route   PUT /api/v1/users/:id/unblock
// @access  Private
exports.UnblockUser = asyncHandler(async (req, res, next) => {
  if (req.user.id === req.params.id)
    return next(new ErrorResponse("User can not unblock itself."));
  //get the id of the user that we block
  let blocked = await User.findById(req.params.id);
  if (!blocked) return next(new ErrorResponse("Blocked User not found", 404));
  if (
    (blocked.blockedBy.filter(
      blocker => blocker.toString() === req.user.id
    ).length = 0)
  )
    return next(new ErrorResponse("User in not blocked", 403));
  let user = await User.findById(req.user.id);
  // check if the user exist
  if (!user) return next(new ErrorResponse("User Not Found", 404));
  unblocked = await User.findByIdAndUpdate(
    req.params.id,
    { $pull: { blockedBy: req.user.id } },
    { new: true, runValidators: true }
  );
  SetUserProfil(blocked.userName, user);
  user = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { blocked: req.params.id } },
    { new: true, runValidators: true }
  );
  SetUserProfil(req.user.name, user);
  res.status(200).json({
    type: "success",
    message: "User unblocked",
    data: [unblocked, user] || [],
  });
});

// @desc    Update a User
// @route   PUT /api/v1/user/update
// @access  Private
exports.UpdateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse("Access not authorize", 401));
  }

  //delete all element is body that are empty because the user didn't feel then up
  Object.keys(req.body).forEach(k => req.body[k] === "" && delete req.body[k]);
  user.updatedAt = Date.now;
  user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });
  SetUserProfil(req.user.name, user);
  res.status(200).json({
    type: "success",
    message: "User updated",
    data: user || {},
  });
});

// @desc    User Change Profile Picture
// @route   PUT /api/v1/user/update-avatar?reset=
// @access  Private
exports.UpdateUserProfil = asyncHandler(async (req, res, next) => {
  if (req.query.reset === "yes") {
    // insert the filemane in the database
    const user_from_db = await User.findByIdAndUpdate(
      req.user.id,
      {
        avatar: path.join(__dirname + `../../public/avatars/default.png`),
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!user_from_db) {
      return next(new ErrorResponse("User not found in DB.", 404));
    }
    SetUserProfil(req.user.name, user_from_db);
    res.status(200).json({
      type: "success",
      message: "User updated",
      data: user_from_db || {},
    });
  } else {
    if (!req.files) {
      return next(new ErrorResponse("Please add a photo", 400));
    }
    const file = req.files.file;
    // make sure the file is an image
    if (!file.mimetype.startsWith("image"))
      return next(new ErrorResponse("Please upload an image file", 403));
    // make sure the image is not an gif
    if (file.mimetype === "image/gif")
      return next(new ErrorResponse("Gif image are not allow", 403));
    // check file size
    if (file.size > process.env.MAX_PIC_SIZE)
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_PIC_SIZE}Mb`,
          400
        )
      );
    // Create costume file name
    file.name = `avatar_${req.user.name}_${Date.now()}${
      path.parse(file.name).ext
    }`;

    // move the file in public/avatars
    file.mv(`${process.env.AVATAR_PIC_PATH}/${file.name}`, async err => {
      if (err) {
        return next(
          new ErrorResponse("Probleme while uploading the file", 500)
        );
      }
      // insert the filemane in the database
      const user_from_db = await User.findByIdAndUpdate(
        req.user.id,
        {
          avatar: path.join(__dirname + `../../public/avatars/${file.name}`),
        },
        {
          new: true,
          runValidators: true,
        }
      );
      if (!user_from_db) {
        return next(new ErrorResponse("User not found in DB.", 404));
      }
      SetUserProfil(req.user.name, user_from_db);
      res.status(200).json({
        type: "success",
        message: "User updated",
        data: user_from_db || {},
      });
    });
  }
});
