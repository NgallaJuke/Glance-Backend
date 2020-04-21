const multer = require("multer");

exports.Upload = (req, res, next) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, process.env.POSTS_PIC_PATH);
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "_" + Date.now());
    },
  });

  const upload = multer({ storage: storage }).single("img_url");

  upload(req, res, (err) => {
    if (err) return res.send("ERRRROOORRRRRR");

    next();
  });
};
