const router = require("express").Router();
const { Register, Login } = require("../controllers/auth");

router.route("/register").post(Register);
router.route("/login").post(Login);
module.exports = router;
