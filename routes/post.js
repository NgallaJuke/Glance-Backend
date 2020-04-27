const router = require("express").Router();
const Post = require("../models/Post");
const {
  getAllPosts,
  CreatePost,
  LikePost,
  UnlikePost,
  GetSinglePost,
} = require("../controllers/post");
const { Protect } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.route("/").get(advancedResults(Post), getAllPosts);
router.route("/create-post").post(Protect, CreatePost);
router.route("/:id").get(GetSinglePost);
router.route("/:id/like").put(Protect, LikePost);
router.route("/:id/unlike").put(Protect, UnlikePost);

module.exports = router;
