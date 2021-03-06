const router = require("express").Router();
const {
  Register,
  ConfirmRegister,
  DeleteUser,
  Login,
  Logout,
  CurrentUser,
  ForgetPassword,
  ResetPassword,
  ChangePassword,
} = require("../controllers/auth");
const { Protect } = require("../middleware/auth");
router.route("/register").post(Register);
router.route("/confirm-register/:fakeToken").post(ConfirmRegister);
router.route("/delete").delete(Protect, DeleteUser);
router.route("/login").post(Login);
router.route("/logout").put(Protect, Logout);
router.route("/current-user").get(Protect, CurrentUser);
router.route("/forget-password").post(ForgetPassword);
router.route("/forget-password/:resetToken").put(ResetPassword);
router.route("/change-password").put(Protect, ChangePassword);
module.exports = router;
