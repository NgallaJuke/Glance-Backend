const router = require("express").Router();
const Post = require("../models/Post");
const {
  GetPostByUser,
  getAllPosts,
  CreatePost,
  DeletePost,
  LikePost,
  UnlikePost,
  GetSinglePost,
  CommentPost,
  LikeComment,
  UnlikeComment,
  SavePost,
  DeleteSavedPost,
} = require("../controllers/post");
const { Protect, Authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.route("/").get(advancedResults(Post), getAllPosts);
router.route("/:userName").get(advancedResults(Post), GetPostByUser);
router.route("/create").post(Protect, Authorize("tailor"), CreatePost);
router.route("/delete").delete(Protect, Authorize("tailor"), DeletePost);
router.route("/:id").get(GetSinglePost);
router.route("/like").put(Protect, LikePost);
router.route("/unlike").put(Protect, UnlikePost);
router.route("/comment").post(Protect, CommentPost);
router.route("/comment/like").put(Protect, LikeComment);
router.route("/comment/unlike").put(Protect, UnlikeComment);
router.route("/save").put(Protect, SavePost);
router.route("/save/delete").delete(Protect, DeleteSavedPost);

module.exports = router;
