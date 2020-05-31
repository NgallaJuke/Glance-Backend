const router = require("express").Router();
const {
  getAllUsers,
  GetSingleUser,
  FollowUser,
  UnfollowUser,
  BlockUser,
  UnblockUser,
  UpdateUser,
  UpdateUserProfil,
} = require("../controllers/user");
const User = require("../models/User");
const { Protect } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.route("/").get(advancedResults(User), getAllUsers);
router.route("/:userName").get(GetSingleUser);
router.route("/:id/follow").put(Protect, FollowUser);
router.route("/:id/unfollow").put(Protect, UnfollowUser);
router.route("/:id/block").put(Protect, BlockUser);
router.route("/:id/unblock").put(Protect, UnblockUser);
router.route("/update").put(Protect, UpdateUser);
router.route("/update-avatar").put(Protect, UpdateUserProfil);

module.exports = router;
