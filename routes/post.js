const router = require("express").Router();
const { CreatePost } = require("../controllers/post");
const { Protect } = require("../middleware/auth");

router.route("/create-post").post(Protect, CreatePost);

module.exports = router;
