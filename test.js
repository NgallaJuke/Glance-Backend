const redis = require("redis");
const client = redis.createClient();
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);

bluebird.promisifyAll(redis.Multi.prototype);
client.on("error", function (error) {
  console.error(error);
});
client.on("connect", function () {
  console.log("Connected to Redis...");
});

const getdata = async () => {
  client.get("PostId:5ec71cb0c3be8d388c0bb39f", (err, reply) => {
    if (err) console.log("ERROR", err);
    console.log("RESPONSE", reply);
    console.log("Post:", JSON.parse(reply));
  });
};

getdata();
