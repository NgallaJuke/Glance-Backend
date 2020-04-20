const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
// @desc    Get A User
// @route   GET /api/v1/auth/users/:id
// @access  Public
exports.GetSingleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }
  res.status(200).json({ success: true, user });
});

// @desc    Follow a User
// @route   PUT /api/v1/user/follow
// @access  Private
exports.FollowUser = asyncHandler(async (req, res, next) => {
  //get the id of the user that we follow
  let followed = await User.findById(req.body.id);

  if (!followed) return next(new ErrorResponse("Followed user not found", 404));

  if (
    followed.follower.filter((follower) => follower === req.user.id).length > 0
  )
    return next(new ErrorResponse("User already followed", 403));

  let user = await User.findById(req.user.id);

  // check if the user exist
  if (!user) return next(new ErrorResponse("User Not Found", 404));

  followed = await User.findByIdAndUpdate(
    req.body.id,
    { $push: { follower: req.user.id } },
    { new: true, runValidators: true }
  );

  user = await User.findByIdAndUpdate(
    req.user.id,
    { $push: { following: req.body.id } },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({ success: true, followed, user });
});

// @desc    Unfollow a User
// @route   PUT /api/v1/user/unfollow
// @access  Private
exports.UnfollowUser = asyncHandler(async (req, res, next) => {
  //get the id of the user that we unfollow
  let unfollowed = await User.findById(req.body.id);

  let user = await User.findById(req.user.id);
  // check if the connected user is following this user
  if (
    user.following.filter((following) => following === req.body.id).length === 0
  )
    return next(new ErrorResponse("User is not followed", 403));

  if (!unfollowed || !user)
    return next(new ErrorResponse("User not found", 404));

  //delete the connected user to this user's follower list
  unfollowed = await User.findByIdAndUpdate(
    req.body.id,
    { $pull: { follower: req.user.id } },
    { new: true, runValidators: true }
  );

  //delete the unfollowed user to the connected user's following list
  user = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { following: req.body.id } },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({ success: true, unfollowed, user });
});

// @desc    Update a User
// @route   PUT /api/v1/auth/users/update
// @access  Private
exports.UpdateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse("Access not authorize", 401));
  }
  user.updatedAt = Date.now;
  user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, user });
});

// @desc    User Change Profile Picture
// @route   PUT /api/v1/auth/users/update-avatar
// @access  Private
exports.UpdateUserProfil = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse("Access not authorize", 401));
  }
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

  // Create costunme file name
  file.name = `avatar_${Date.now()}${path.parse(file.name).ext}`;

  // move the file
  file.mv(`${process.env.AVATAR_PIC_PATH}/${file.name}`, async (err) => {
    if (err) {
      return next(new ErrorResponse("Probleme while uploading the file", 500));
    }

    // insert the filemane in the database
    user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: path.join(__dirname + `../../public/avatars/${file.name}`) },
      {
        new: true,
        runValidators: true,
      }
    );
  });

  res.status(200).json({ success: true, user });
});
