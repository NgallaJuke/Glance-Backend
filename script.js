const client = require("./utils/redis");
const colors = require("colors");

client.on("ready", function () {
  console.log("Redis Ready".yellow);
  const deleteKey = async (key) => {
    client.keys(`*${key}*`, (err, userHomeFeeds) => {
      if (err) console.error(err);
      console.log("keys", userHomeFeeds);
      if (userHomeFeeds) {
        userHomeFeeds.forEach((userHomeFeed) => {
          client.del(userHomeFeed, (err, response) => {
            if (response == 1) {
              console.log(`${userHomeFeed} ` + "Deleted Successfully!".green);
            } else {
              console.log("Cannot delete".red);
            }
          });
        });
      } else {
        console.log("something went wrong");
      }
    });
  };

  const flushRedis = async () => {
    client.flushall((err, res) => {
      if (err) console.error(err);
      console.log('"Redis Flushed Successfully!');
    });
  };

  if (process.argv[2] === "-f") {
    flushRedis("UserProfil");
  }
  if (process.argv[2] === "-d" && process.argv[3] === "-u") {
    deleteKey("UserProfil");
  }
  if (process.argv[2] === "-d" && process.argv[3] === "-uf") {
    deleteKey("UserFeeds");
  }
  if (process.argv[2] === "-d" && process.argv[3] === "-hf") {
    deleteKey("UserHomeFeeds");
  }
});
