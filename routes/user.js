const router = require("express").Router();
const {
  getAllUsers,
  GetSingleUser,
  FollowUser,
  UnfollowUser,
  UpdateUser,
  UpdateUserProfil,
} = require("../controllers/user");
const User = require("../models/User");
const { Protect } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.route("/").get(advancedResults(User), getAllUsers);
router.route("/:id").get(GetSingleUser);
router.route("/follow").put(Protect, FollowUser);
router.route("/unfollow").put(Protect, UnfollowUser);
router.route("/update").put(Protect, UpdateUser);
router.route("/update-avatar").put(Protect, UpdateUserProfil);

module.exports = router;
