const router = require("express").Router();
const Comment = require("../models/Comment");
const { Protect } = require("../middleware/auth");
const { MakeComment } = require("../controllers/comment");
router.route("/:posyID/comment").post(Protect, MakeComment);

module.exports = router;
