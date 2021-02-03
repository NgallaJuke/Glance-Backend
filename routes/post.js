const router = require("express").Router();
const Post = require("../models/Post");
const {
  GetUserFeed,
  GetUserHomeFeed,
  getAllPosts,
  CreatePost,
  DeletePost,
  LikePost,
  UnlikePost,
  GetSinglePost,
  SavePost,
  DeleteSavedPost,
} = require("../controllers/post");
const { Protect, Authorize } = require("../middleware/auth");
// const advancedResults = require("../middleware/advancedResults");

router.route("/").get(getAllPosts);
router.route("/timeline").get(Protect, GetUserFeed);
router.route("/:userName/home-timeline").get(Protect, GetUserHomeFeed);
router.route("/create").post(Protect, Authorize("tailor"), CreatePost);
router.route("/delete").delete(Protect, Authorize("tailor"), DeletePost);
router.route("/:id").get(GetSinglePost);
router.route("/:id/like").put(Protect, LikePost);
router.route("/:id/unlike").put(Protect, UnlikePost);
router.route("/:id/save").put(Protect, SavePost);
router.route("/save/:id/delete").delete(Protect, DeleteSavedPost);

module.exports = router;
