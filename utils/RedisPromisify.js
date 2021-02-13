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

exports.aGetPostCache = async (postID, next) => {
  const Post = await ahget("Posts", `PostId:${postID}`);
  if (Post) {
    return Post;
  } else {
    return next(new ErrorResponse("Error get cached post", 500));
  }
};

exports.aGetUserFeed = async (userID, next) => {
  const postIDs = await ahgetall(`UserFeeds:${userID}`);
  if (!postIDs) return next(new ErrorResponse("TimeLine Is Empty !", 500));
  let userTimeline = [];
  for (const postId in postIDs) {
    if (postIDs.hasOwnProperty(postId)) {
      const element = postIDs[postId];
      const cachedPost = await ahget("Posts", `PostId:${element}`);
      if (!cachedPost)
        return next(new ErrorResponse("Error getting cached post", 500));
      let newPost = JSON.parse(cachedPost);
      //check if the post is own by a followed user. If not then remove it from the timeline
      const user = await aget(`UserProfil:${newPost.postOwner.userName}`);
      if (!user)
        return next(new ErrorResponse("Error get cached user's profil", 500));
      newPost.postOwner = JSON.parse(user);

      // TODO : if the user ont folowed anymore rmeove his post from the timeline
      userTimeline.push(newPost);

      if (userTimeline.length === Object.keys(postIDs).length)
        return userTimeline;
    }
  }
};

exports.aGetUserHomeFeed = async (userName, limit, next) => {
  const user = await aget(`UserProfil:${userName}`);
  const postIDs = await ahgetall(`UserHomeFeeds:${userName}`);
  let userHomeFeed = [];
  if (limit === "all") {
    for (const postId in postIDs) {
      if (postIDs.hasOwnProperty(postId)) {
        const element = postIDs[postId];
        const cachedPost = await ahget("Posts", `PostId:${element}`);
        if (!cachedPost) {
          return next(new ErrorResponse("Error getting cached post", 500));
        } else {
          let newPost = JSON.parse(cachedPost);
          // here we upadate the postOwner Propreties in case he changed his avatar for example
          newPost.postOwner = JSON.parse(user);
          userHomeFeed.push(newPost);
          if (userHomeFeed.length === Object.keys(postIDs).length)
            return userHomeFeed;
        }
      }
    }
  } else {
    let arr = [];
    for (const postId in postIDs) {
      arr.push(postId);
    }
    for (let n = arr.length; n--; ) {
      const element = postIDs[arr[n]];
      const cachedPost = await ahget("Posts", `PostId:${element}`);
      if (!cachedPost) {
        return next(new ErrorResponse("Error getting cached post", 500));
      } else {
        let newPost = JSON.parse(cachedPost);
        // here we upadate the postOwner Propreties in case he changed his avatar for example
        newPost.postOwner = JSON.parse(user);
        userHomeFeed.push(newPost);
        if (
          userHomeFeed.length === Object.keys(postIDs).length ||
          userHomeFeed.length === limit
        )
          return userHomeFeed.reverse();
      }
    }
  }
};

exports.DeletePostsCache = (postID) => {
  client.hdel("Posts", `PostId:${postID}`);
};

exports.DeleteUserProfil = (userName) => {
  const userKey = `UserProfil:${userName}`;
  client.DEL(userKey);
};
