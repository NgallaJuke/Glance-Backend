const router = require("express").Router();
const {
  Register,
  ConfirmRegister,
  deleteUser,
  Login,
  Logout,
  CurrentUser,
  ForgetPassword,
  ResetPassword,
} = require("../controllers/auth");
const { Protect } = require("../middleware/auth");
router.route("/register").post(Register);
router.route("/confirm-register/:fakeToken").post(ConfirmRegister);
router.route("/delete").delete(Protect, deleteUser);
router.route("/login").post(Login);
router.route("/logout").put(Protect, Logout);
router.route("/current-user").get(Protect, CurrentUser);
router.route("/forget-password").post(ForgetPassword);
router.route("/forget-password/:resetToken").put(ResetPassword);
module.exports = router;
