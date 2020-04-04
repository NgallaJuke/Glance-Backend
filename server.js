const express = require("express");
const dotenv = require("dotenv");
const color = require("colors");
const app = express();

//require env variables
dotenv.config({ path: "./config/config.env" });

//database connection
const DBconnect = require("./config/db.js");
DBconnect();

// setting up port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`App running on port ${PORT}`.blue.bold));
