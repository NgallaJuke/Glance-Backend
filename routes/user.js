const router = require("express").Router();
const {
  GetSingleUser,
  FollowUser,
  UnfollowUser,
  UpdateUser,
} = require("../controllers/user");
const { Protect } = require("../middleware/auth");
// router.route("/").get(getUsers);
router.route("/:id").get(GetSingleUser);
router.route("/follow").put(Protect, FollowUser);
router.route("/unfollow").put(Protect, UnfollowUser);
router.route("/update").put(Protect, UpdateUser);

module.exports = router;
