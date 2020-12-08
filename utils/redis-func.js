const client = require("../utils/redis");
const ErrorResponse = require("../utils/errorResponse");

exports.SetUserProfil = (userName, user) => {
  const userKey = `UserProfil:${userName}`;
  client.set(userKey, JSON.stringify(user));
};

exports.SetPostCache = (postID, post) => {
  const postKey = `PostId:${postID}`;
  client.hset("Posts", postKey, JSON.stringify(post), (err) => {
    if (err) return err;
  });
};

exports.SetUserFeed = (userID, postID) => {
  client.hset(`UserFeeds:${userID}`, `Post:${postID}`, postID);
};

exports.SetUserHomeFeed = (userID, postID) => {
  client.hset(`UserHomeFeeds:${userID}`, `Post:${postID}`, postID);
};

exports.GetUserFeed = (userID, res, next) => {
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
          if (err || post === null)
            return next(
              new ErrorResponse("Error while getting Cached post.", 500)
            );
          userTimeline.push(JSON.parse(post));
          if (userTimeline.length === i)
            res.status(200).json({
              success: true,
              timeline: userTimeline,
            });
        });
      }
    }
  });
};

exports.GetUserHomeFeed = (userID, res, next) => {
  client.hgetall(`UserHomeFeeds:${userID}`, async (err, posts) => {
    if (err) return next(new ErrorResponse("Error get UserFeed.", 500));
    if (posts === null || posts === undefined)
      return next(new ErrorResponse("HomeTime is empty.", 404));
    let userHomeFeed = [];
    let i = 0;
    for (const postId in posts) {
      i++;
      if (posts.hasOwnProperty(postId)) {
        const element = posts[postId];
        client.hget("Posts", `PostId:${element}`, (err, post) => {
          if (err)
            return next(new ErrorResponse("Error get Cached post.", 500));
          userHomeFeed.push(JSON.parse(post));
          if (userHomeFeed.length === i)
            res.status(200).json({
              success: true,
              timeline: userHomeFeed,
            });
        });
      }
    }
  });
};

exports.GetPostCache = (postID, callback) => {
  client.hget("Posts", `PostId:${postID}`, callback);
};

exports.DeletePostsCache = (postID) => {
  const postKey = `PostId:${postID}`;
  client.hdel("Posts", postKey);
};

exports.GetUserProfil = (userName, callback) => {
  client.get(`UserProfil:${userName}`, callback);
};

exports.GetAllUserProfil = (callback) => {
  client.KEYS("*UserProfil*", callback);
};

exports.DeleteUserProfil = (userName) => {
  const userKey = `UserProfil:${userName}`;
  client.DEL(userKey);
};
