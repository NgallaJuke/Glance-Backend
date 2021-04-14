const client = require("./utils/redis");
const fs = require("fs");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");
//Promesified all redis function so that whe can exit process easily
const { promisify } = require("util");
const akeys = promisify(client.keys).bind(client);
const adel = promisify(client.del).bind(client);
const aflushall = promisify(client.flushall).bind(client);

// load env variables
dotenv.config({ path: "./config/development.env" });

// loads models
const User = require("./models/User");
const Post = require("./models/Post");

// connect to mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});
/* ------------- CREATE ------------- */

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/user.json`, "utf-8")
);

const importUsers = async () => {
  try {
    await User.create(users);
    console.log("User Data Imported Successfully In Database".green.inverse);
    process.exit();
  } catch (error) {
    console.error(error);
  }
};
const deleteDbUsers = async () => {
  try {
    await User.deleteMany();
    console.log("User Data Deleted Successfully in Database".red.inverse);
  } catch (error) {
    console.error(error);
  }
};
const deleteDbPost = async () => {
  try {
    await Post.deleteMany();
    console.log("Post Data Deleted Successfully in Database".red.inverse);
  } catch (error) {
    console.error(error);
  }
};

//Import User to Database
if (process.argv[2] === "-i" && process.argv[3] === "-u") {
  importUsers();
}

/* ------------- DELETE ------------- */

//Read Json File
client.on("ready", async function () {
  console.log("Redis Ready".white.inverse);
  const deleteKey = async key => {
    try {
      const datas = await akeys(`*${key}*`);
      for (const data of datas) {
        await adel(data);
      }
      console.log(`All ${key} Deleted Successfully On Redis`.red.inverse);
      process.exit();
    } catch (error) {
      console.error(error);
    }
  };

  //Delete al the data in the Redis Cache system
  const flushRedis = async () => {
    try {
      await aflushall();
      console.log("Redis Flushed Successfully On Redis".red.inverse);
      process.exit();
    } catch (error) {
      console.error(error);
    }
  };

  //Flush all Redis database
  if (process.argv[2] === "-f") flushRedis();

  //Delete All user profils on Redis & Database
  if (process.argv[2] === "-d" && process.argv[3] === "-au") {
    await deleteDbUsers();
    deleteKey("UserProfil");
  }
  //Delete All user profils on Redis
  if (process.argv[2] === "-d" && process.argv[3] === "-chu")
    deleteKey("UserProfil");

  //Delete All user profils on  Database
  if (process.argv[2] === "-d" && process.argv[3] === "-dbu") deleteDbUsers();

  //Delete all users UserFeeds on Redis
  if (process.argv[2] === "-d" && process.argv[3] === "-uf")
    deleteKey("UserFeeds");

  //Delete all users UserHomeFeeds on Redis
  if (process.argv[2] === "-d" && process.argv[3] === "-hf")
    deleteKey("UserHomeFeeds");

  //Delete all post on Redis & Database
  if (process.argv[2] === "-d" && process.argv[3] === "-ap") {
    await deleteDbPost();
    deleteKey("Posts");
  }

  //Delete all post on Redis
  if (process.argv[2] === "-d" && process.argv[3] === "-chp")
    deleteKey("Posts");

  //Delete all post on Redis & Database
  if (process.argv[2] === "-d" && process.argv[3] === "-dbp") deleteDbPost();
});

/* ------------------- NOTE -------------------  */

//Flush all Redis database
// # node script -f

// //Impostuser profil on Database
// # node script -i -u

// //Delete All user profil on Redis & Database
// # node script -d -au

// //Delete All user profil on Redis
// # node script -d -chu

// //Delete All user profil on  Database
// # node script -d -dbu

// //Delete all users UserFeeds on Redis
// # node script -d -uf

// //Delete all users UserHomeFeeds on Redis
// # node script -d -hf

// //Delete all post on Redis & Database
// # node script -d -ap

//Delete all post on Redis
// # node script -d -chp

//Delete all post on Database
// # node script -d -dbp

/* ------------------------------- */
