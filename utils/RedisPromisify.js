const { promisify } = require("util");
const client = require("../utils/redis");
const ErrorResponse = require("../utils/errorResponse");
const aget = promisify(client.get).bind(client);
const ahget = promisify(client.hget).bind(client);
const ahset = promisify(client.hset).bind(client);
const ahgetall = promisify(client.hgetall).bind(client);
const akeys = promisify(client.keys).bind(client);

exports.SetUserProfil = (userName, user) => {
  const userKey = `UserProfil:${userName}`;
  client.set(userKey, JSON.stringify(user));
};

exports.SetPostCache = async (postID, post) => {
  const postKey = `PostId:${postID}`;
  await ahset("Posts", postKey, JSON.stringify(post));
};

exports.SetUserFeed = async (userID, postID) => {
  await ahset(`UserFeeds:${userID}`, `Post:${postID}`, postID);
};

exports.SetUserHomeFeed = async (userName, postID) => {
  await ahset(`UserHomeFeeds:${userName}`, `Post:${postID}`, postID);
};

exports.aGetUserProfil = async userName => {
  const UserProfile = await aget(`UserProfil:${userName}`);
  console.log('UserProfile', UserProfile);

  if (UserProfile) {
    return JSON.parse(UserProfile);
  } else {
    return;
  }
};

exports.aGetAllUserProfil = async reqUserName => {
  let keys = await akeys("*UserProfil*");
  if (keys) {
    if (keys.includes("UserProfil:undefined"))
      keys = keys.filter(key => key !== "UserProfil:undefined");

    let users = [];
    for (const key in keys) {
      const element = keys[key];
      const userName = element.substring(11);
      if (userName === reqUserName || userName === "undefined") continue;

      const user = await aget(`UserProfil:${userName}`);
      if (!user) return {};
      users.push(JSON.parse(user));
    }
    console.log(`users`, users);
    return users;
  } else {
    return {};
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

exports.aGetHasTagPostCache = async (postsWithGivenHashtag, limit) => {
  let hashTagPost = [];

  for (const post in postsWithGivenHashtag) {
    if (postsWithGivenHashtag.hasOwnProperty(post)) {
      const element = postsWithGivenHashtag[post];
      const postWithHashtag = await ahget("Posts", `PostId:${element._id}`);
      const parsedPost = JSON.parse(postWithHashtag);
      hashTagPost.push(parsedPost);
      if (hashTagPost.length === limit) break;
    }
  }

  return hashTagPost;
};

exports.aGetAllPosts = async (limit, reqUserId) => {
  const postIDs = await ahgetall(`Posts`);
  if (!postIDs) return;
  let discoverPost = [];
  for (const postId in postIDs) {
    if (postIDs.hasOwnProperty(postId)) {
      const element = postIDs[postId];
      let newPost = JSON.parse(element);
      //check if the post is own by a followed user. If not then remove it from the timeline
      const user = await aget(`UserProfil:${newPost.postOwner.userName}`);
      if (!user) continue;
      let postOwner = JSON.parse(user);
      if (postOwner._id == reqUserId) continue;
      newPost.postOwner = JSON.parse(user);
      // TODO : if the user ont followed anymore remove his post from the timeline
      discoverPost.push(newPost);
      if (
        discoverPost.length === Object.keys(postIDs).length ||
        discoverPost.length == limit
      )
        break;
    }
  }
  return discoverPost;
};

exports.aGetUserFeed = async (userID, next) => {
  const postIDs = await ahgetall(`UserFeeds:${userID}`);

  if (!postIDs) return;
  let userTimeline = [];
  for (const postId in postIDs) {
    if (postIDs.hasOwnProperty(postId)) {
      const element = postIDs[postId];
      const cachedPost = await ahget(
        "Posts",
        `PostId:${element.replace(/['"]+/g, "")}`
      );
      if (!cachedPost) continue;
      let newPost = JSON.parse(cachedPost);
      //check if the post is own by a followed user. If not then remove it from the timeline
      const user = await aget(`UserProfil:${newPost.postOwner.userName}`);
      if (!user) continue;
      newPost.postOwner = JSON.parse(user);

      // TODO : if the user ont followed anymore remove his post from the timeline
      userTimeline.push(newPost);

      if (userTimeline.length === Object.keys(postIDs).length) break;
    }
  }
  return userTimeline;
};

exports.aGetUserHomeFeed = async (userName, limit, next) => {
  const user = await aget(`UserProfil:${userName}`);
  const postIDs = await ahgetall(`UserHomeFeeds:${userName}`);
  if (!postIDs) return;
  let userHomeFeed = [];
  //limmit === 'all' give all the post made by the user and limit === 4 gives the last 4 posts made by the user
  if (limit === "all") {
    for (const postId in postIDs) {
      if (postIDs.hasOwnProperty(postId)) {
        const element = postIDs[postId];
        const cachedPost = await ahget("Posts", `PostId:${element}`);
        if (!cachedPost) {
          continue;
        } else {
          let newPost = JSON.parse(cachedPost);
          // here we upadate the postOwner Propreties in case he changed his avatar for example
          newPost.postOwner = JSON.parse(user);
          userHomeFeed.push(newPost);
          if (userHomeFeed.length === Object.keys(postIDs).length) break;
        }
      }
    }
    return userHomeFeed;
  } else {
    let arr = [];
    for (const postId in postIDs) {
      arr.push(postId);
    }
    for (let n = arr.length; n--;) {
      const element = postIDs[arr[n]];
      const cachedPost = await ahget("Posts", `PostId:${element}`);
      if (!cachedPost) {
        continue;
      } else {
        let newPost = JSON.parse(cachedPost);
        // here we upadate the postOwner Propreties in case he changed his avatar for example
        newPost.postOwner = JSON.parse(user);
        userHomeFeed.push(newPost);
        if (
          userHomeFeed.length === Object.keys(postIDs).length ||
          userHomeFeed.length === limit
        )
          break;
      }
    }
    return userHomeFeed.reverse();
  }
};

exports.DeletePostsCache = postID => {
  client.hdel("Posts", `PostId:${postID}`);
};

exports.DeleteUserProfil = userName => {
  const userKey = `UserProfil:${userName}`;
  client.DEL(userKey);
};
