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
  LikeComment,
  UnlikeComment,
  SavePost,
} = require("../controllers/post");
const { Protect } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.route("/").get(advancedResults(Post), getAllPosts);
router.route("/:userName").get(advancedResults(Post), GetPostByUser);
router.route("/create-post").post(Protect, CreatePost);
router.route("/:id").get(GetSinglePost);
router.route("/like").put(Protect, LikePost);
router.route("/unlike").put(Protect, UnlikePost);
router.route("/comment").post(Protect, CommentPost);
router.route("/comment/like").put(Protect, LikeComment);
router.route("/comment/unlike").put(Protect, UnlikeComment);
router.route("/save").put(Protect, SavePost);

module.exports = router;
