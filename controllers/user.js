// @desc    Get All Users
// @route   GET /api/v1/auth/users
// @access  Private/admin
exports.getUsers = (req, res) => {
  res.status(200).json({ success: true, msg: "HOME PAGE" });
};

// @desc    Get A User
// @route   GET /api/v1/auth/users/:id
// @access  Private/admin
exports.getSingleUser = (req, res) => {
  res.status(200).json({ success: true, msg: req.params.id });
};
