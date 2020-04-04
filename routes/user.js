const router = require("express").Router();
const { getUsers, getSingleUser } = require("../controllers/user");
router.route("/").get(getUsers);
router.route("/:id").get(getSingleUser);

module.exports = router;
