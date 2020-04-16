const router = require("express").Router();
const { Register, Login, CurrentUser } = require("../controllers/auth");
const { Protect } = require("../middleware/auth");
router.post("/register", Register);
router.post("/login", Login);
router.get("/current-user", Protect, CurrentUser);
module.exports = router;
