const router = require("express").Router();
const Post = require("../models/Post");
const {
  GetPostByUser,
  getAllPosts,
  CreatePost,
  LikePost,
  UnlikePost,
  GetSinglePost,
  CommentPost,
} = require("../controllers/post");
const { Protect } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.route("/").get(advancedResults(Post), getAllPosts);
router.route("/:userName").get(advancedResults(Post), GetPostByUser);
router.route("/create-post").post(Protect, CreatePost);
router.route("/:id").get(GetSinglePost);
router.route("/:id/like").put(Protect, LikePost);
router.route("/:id/unlike").put(Protect, UnlikePost);
router.route("/:id/comment").put(Protect, CommentPost);

module.exports = router;
