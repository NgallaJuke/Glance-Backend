const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const errorHandler = require("./middleware/error");
const color = require("colors");
const fileupload = require("express-fileupload");
const app = express();
const bodyParser = require("body-parser");
const cookie_parser = require("cookie-parser");

//require env variables
dotenv.config({ path: "./config/config.env" });

//database connection
const DBconnect = require("./config/db.js");
DBconnect();

//Get the Routes
const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const postRoute = require("./routes/post");

//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Cookie Parser: allow to send token in cookie t
app.use(cookie_parser());

//User Morgan for dev logger
if (process.env.NODE_ENV === "developement") app.use(morgan("dev"));

// file Uploader
app.use(fileupload());

// STATIC folder for the file
app.use(express.static(path.join(__dirname, "public")));

//use the routes
app.use("/api/v1/auth/", authRoute);
app.use("/api/v1/user/", userRoute);
app.use("/api/v1/post/", postRoute);

// Use the Error Handler
app.use(errorHandler);

// setting up port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(
    ` Server runing in `.blue +
      `${process.env.NODE_ENV}`.blue.underline.bold +
      ` mode on port `.blue +
      `${PORT}`.blue.underline.bold
  )
);
