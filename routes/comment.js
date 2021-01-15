const router = require("express").Router();
const Comment = require("../models/Comment");
const { Protect } = require("../middleware/auth");
const {
  MakeComment,
  DeleteComment,
  GetAllPostComments,
} = require("../controllers/comment");
router.route("/:postID/comment").post(Protect, MakeComment);
router.route("/:postID/delete/:commentID").delete(Protect, DeleteComment);
router.route("/:postID/comment/all").get(Protect, GetAllPostComments);

module.exports = router;
