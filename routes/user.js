const router = require("express").Router();
const {
  getUsers,
  getSingleUser,
  FollowUser,
  UnfollowUser,
} = require("../controllers/user");
const { Protect } = require("../middleware/auth");
router.route("/").get(getUsers);
router.route("/:id").get(getSingleUser);
router.route("/follow").put(Protect, FollowUser);
router.route("/unfollow").put(Protect, UnfollowUser);

module.exports = router;
