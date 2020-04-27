const router = require("express").Router();
const {
  Register,
  deleteUser,
  Login,
  CurrentUser,
  ForgetPassword,
  ResetPassword,
} = require("../controllers/auth");
const { Protect } = require("../middleware/auth");
router.route("/register").post(Register);
router.route("/delete").delete(deleteUser);
router.route("/login").post(Login);
router.route("/current-user").get(Protect, CurrentUser);
router.route("/forget-password").post(ForgetPassword);
router.route("/forget-password/:resetToken").put(ResetPassword);
module.exports = router;
