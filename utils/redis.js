const redis = require("redis");
const ErrorResponse = require("./errorResponse");

// Create Redis Client
const client = redis.createClient();

client.on("error", function (error) {
  console.error(error);
});
client.on("connect", function () {
  console.log("Connected to Redis...".black.bgWhite);
});
module.exports = client;
