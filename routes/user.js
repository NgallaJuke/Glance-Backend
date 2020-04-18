const router = require("express").Router();
const { getUsers, getSingleUser, FollowUser } = require("../controllers/user");
const { Protect } = require("../middleware/auth");
router.route("/").get(getUsers);
router.route("/:id").get(getSingleUser);
router.route("/follow").put(Protect, FollowUser);

module.exports = router;
