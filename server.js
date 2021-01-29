const path = require("path");
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const app = express();
const server = http.createServer(app);
const morgan = require("morgan");
const errorHandler = require("./middleware/error");
const color = require("colors");
const fileupload = require("express-fileupload");
const bodyParser = require("body-parser");
const cookie_parser = require("cookie-parser");
const socketio = require("socket.io");
const cors = require("cors");
const methodOverride = require("method-override");
// const io = socketio(server);

//allow cors
app.use(
  cors({
    credentials: true,
    origin: "*", //change it for prod and dev environement
  })
);

// userMethodeOverride to accepte PUT and DELETE methode in form
app.use(methodOverride("_method"));

//require env variables
dotenv.config({
  path: `./config/${process.env.NODE_ENV.substring(
    0,
    process.env.NODE_ENV.length - 1
  )}.env`,
});

//database connection
const DBconnect = require("./config/db.js");
DBconnect();

//Get the Routes
const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const postRoute = require("./routes/post");
const commentRoute = require("./routes/comment");

//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Cookie Parser: allow to send token in cookie t
app.use(cookie_parser());

//User Morgan for dev logger
if (
  process.env.NODE_ENV.substring(0, process.env.NODE_ENV.length - 1) ===
  "development"
) {
  app.use(morgan("dev"));
}

// file Uploader
app.use(fileupload());

// STATIC folder for the file
app.use(express.static(path.join(__dirname, "public")));

//use the routes
app.use("/api/v1/auth/", authRoute);
app.use("/api/v1/users/", userRoute);
app.use("/api/v1/posts/", postRoute);
app.use("/api/v1/comments/", commentRoute);

// Use the Error Handler
app.use(errorHandler);

// Run SocketIO when a user is connected
// io.on("connection", (socket) => {
//   console.log(" New User Connected".green);
// });

// setting up port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(
    `SUCCESS:`.yellow +
      `Server runing in `.blue +
      `${process.env.NODE_ENV}`.blue.bold +
      ` mode on port `.blue +
      `${PORT}`.blue.bold
  )
);
