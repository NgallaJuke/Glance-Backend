const client = require("../utils/redis");
const ErrorResponse = require("../utils/errorResponse");

exports.SetUserTimeLine = (userID, postID) => {
  client.hset(`UserFeeds:${userID}`, `Post:${postID}`, postID);
};

exports.GetUserTimeLine = (userID, res, next) => {
  client.hgetall(`UserFeeds:${userID}`, async (err, posts) => {
    if (err) return next(new ErrorResponse("Error get UserFeed.", 500));
    if (posts === null || posts === undefined)
      return next(new ErrorResponse("HomeTime is empty.", 404));
    let userTimeline = [];
    let i = 0;
    for (const postId in posts) {
      i++;
      if (posts.hasOwnProperty(postId)) {
        const element = posts[postId];
        client.hget("Posts", `PostId:${element}`, (err, post) => {
          if (err)
            return next(new ErrorResponse("Error get Cached post.", 500));
          userTimeline.push(JSON.parse(post));
          if (userTimeline.length === i)
            res.status(200).json({
              success: true,
              userTimeline,
            });
        });
      }
    }
  });
};

exports.SetPostsCache = (postID, post) => {
  const postKey = `PostId:${postID}`;
  client.hset("Posts", postKey, JSON.stringify(post), (err) => {
    if (err) return err;
  });
};

exports.GetPostsCache = (postID, callback) => {
  client.hget("Posts", `PostId:${postID}`, callback);
};

exports.DeletePostsCache = (postID) => {
  const postKey = `PostId:${postID}`;
  client.hdel("Posts", postKey);
};

exports.SetUserProfil = (userName, user) => {
  const userKey = `UserProfil:${userName}`;
  client.set(userKey, JSON.stringify(user));
};

exports.GetUserProfil = (userName, callback) => {
  client.get(`UserProfil:${userName}`, callback);
};

exports.DeleteUserProfil = (userName) => {
  const userKey = `UserProfil:${userName}`;
  client.del(userKey);
};
