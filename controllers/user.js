const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get All Users
// @route   GET /api/v1/auth/users
// @access  Private/admin
exports.getUsers = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, msg: "HOME PAGE" });
});

// @desc    Get A User
// @route   GET /api/v1/auth/users/:id
// @access  Private/admin
exports.getSingleUser = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, msg: req.params.id });
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
