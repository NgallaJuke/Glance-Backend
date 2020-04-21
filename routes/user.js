const router = require("express").Router();
const {
  GetSingleUser,
  FollowUser,
  UnfollowUser,
  UpdateUser,
  UpdateUserProfil,
} = require("../controllers/user");
const { Protect } = require("../middleware/auth");

router.route("/:id").get(GetSingleUser);
router.route("/follow").put(Protect, FollowUser);
router.route("/unfollow").put(Protect, UnfollowUser);
router.route("/update").put(Protect, UpdateUser);
router.route("/update-avatar").put(Protect, UpdateUserProfil);

module.exports = router;
