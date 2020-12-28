const { promisify } = require("util");
const client = require("../utils/redis");
const ErrorResponse = require("../utils/errorResponse");
const aget = promisify(client.get).bind(client);
const ahget = promisify(client.hget).bind(client);
const ahgetall = promisify(client.hgetall).bind(client);
const akeys = promisify(client.keys).bind(client);

exports.SetUserProfil = (userName, user) => {
  const userKey = `UserProfil:${userName}`;
  client.set(userKey, JSON.stringify(user));
};

exports.SetPostCache = (postID, post) => {
  const postKey = `PostId:${postID}`;
  client.hset("Posts", postKey, JSON.stringify(post));
};

exports.SetUserFeed = (userID, postID) => {
  client.hset(`UserFeeds:${userID}`, `Post:${postID}`, postID);
};

exports.SetUserHomeFeed = (userName, postID) => {
  client.hset(`UserHomeFeeds:${userName}`, `Post:${postID}`, postID);
};

exports.aGetUserProfil = async (userName, next) => {
  const UserProfile = await aget(`UserProfil:${userName}`);
  if (UserProfile) {
    return UserProfile;
  } else {
    return next(new ErrorResponse("Error get cached user's profile", 500));
  }
};

exports.aGetAllUserProfil = async (req, next) => {
  let keys = await akeys("*UserProfil*");
  if (keys) {
    if (keys.includes("UserProfil:undefined"))
      keys = keys.filter((key) => key !== "UserProfil:undefined");
    let i = 0;
    let users = [];
    for (const key in keys) {
      const element = keys[key];
      const userName = element.substring(11);
      const user = await aget(`UserProfil:${userName}`);
      if (!user)
        return next(new ErrorResponse("Error get cached user's profile", 500));
      if (userName !== req.user.name && userName !== "undefined") {
        i++;
        users.push(JSON.parse(user));
        if (i === keys.length - 1) {
          return users;
        }
      }
    }
  } else {
    return next(new ErrorResponse("Error get cached users profiles", 500));
  }
};

exports.GetPostCache = async (postID, next) => {
  const Post = await ahget("Posts", `PostId:${postID}`);
  if (Post) {
    return Post;
  } else {
    return next(new ErrorResponse("Error get cached post", 500));
  }
};

exports.DeletePostsCache = (postID) => {
  client.hdel("Posts", `PostId:${postID}`);
};

exports.GetUserFeed = async (userID, res, next) => {
  const postIDs = await ahgetall(`UserFeeds:${userID}`);
  if (!postIDs) {
    return next(new ErrorResponse("Error get user's feed", 500));
  } else {
    let userTimeline = [];
    let i = 0;
    for (const postId in postIDs) {
      i++;
      const element = postIDs[postId];
      const cachedPost = await ahget("Posts", `PostId:${element}`);
      if (!cachedPost) {
        return next(new ErrorResponse("Error getting cached post.", 500));
      } else {
        let newPost = JSON.parse(cachedPost);
        const user = await GetUserProfil(newPost.postOwner.userName);
        // here we upadate the postOwner Propreties in case he changed his avatar for example
        newPost.postOwner = JSON.parse(user);
        userTimeline.push(newPost);
        if (userTimeline.length === i)
          res.status(200).json({
            success: true,
            timeline: userTimeline,
          });
      }
    }
  }
};

exports.GetUserHomeFeed = async (userName, res, next) => {
  const postIDs = await ahgetall(`UserFeeds:${userID}`);
  if (!postIDs) {
    return next(new ErrorResponse("Error get user's feed", 500));
  } else {
    const user = await GetUserProfil(userName);
    let userHomeFeed = [];
    let i = 0;
    for (const postId in postIDs) {
      i++;
      const element = postIDs[postId];
      const cachedPost = await ahget("Posts", `PostId:${element}`);
      if (!cachedPost) {
        return next(new ErrorResponse("Error getting cached post.", 500));
      } else {
        let newPost = JSON.parse(cachedPost);
        // here we upadate the postOwner Propreties in case he changed his avatar for example
        newPost.postOwner = JSON.parse(user);
        userHomeFeed.push(newPost);
        if (userHomeFeed.length === i)
          res.status(200).json({
            success: true,
            timeline: userHomeFeed,
          });
      }
    }
  }
};
