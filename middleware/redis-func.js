const client = require("../utils/redis");

exports.CreateUserTimeLine = (userID, postID, post) => {
  const keyFollower = `User:${userID}`;
  const postKey = `PostId:${postID}`;
  client.hset(keyFollower, postKey, JSON.stringify(post), (err) => {
    if (err) return err;
  });
};

exports.GetLastPostOfFollowers = (userName, user) => {};

exports.CacheUserProfil = (userName, user) => {
  const userKey = `UserProfil:${userName}`;
  client.set(userKey, JSON.stringify(user));
};

exports.ReadCachedUserProfil = (userName, key, callback) => {
  const userKey = userName ? `UserProfil:${userName}` : key;
  client.get(userKey, callback);
};
