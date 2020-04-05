const router = require("express").Router();
const { Register } = require("../controllers/auth");

router.route("/register").post(Register);
module.exports = router;
