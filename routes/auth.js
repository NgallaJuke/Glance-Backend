const router = require("express").Router();
const {
  Register,
  Login,
  CurrentUser,
  ForgetPassword,
} = require("../controllers/auth");
const { Protect } = require("../middleware/auth");
router.route("/register").post(Register);
router.route("/login").post(Login);
router.route("/current-user").get(Protect, CurrentUser);
router.route("/forget-password").post(ForgetPassword);
module.exports = router;
