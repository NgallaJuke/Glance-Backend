const express = require("express");
const dotenv = require("dotenv");
const color = require("colors");
const app = express();

//require env variables
dotenv.config({ path: "./config/config.env" });

//database connection
const DBconnect = require("./config/db.js");
DBconnect();

//Get the Routes
const userRoute = require("./routes/user");

//use the routes
app.use("/api/v1/user", userRoute);

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
