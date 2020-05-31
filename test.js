const {
  SetUserTimeLine,
  SetUserProfil,
  GetUserProfil,
  GetUserTimeLine,
  GetPostsCache,
  SetPostsCache,
} = require("./middleware/redis-func");

SetPostsCache("1234", "POST 1");
SetUserTimeLine(
  "001",
  GetPostsCache("1234", (err, post) => {
    console.log("POST", post);
  })
);

GetUserTimeLine("001");
