var jsonObj = {
  members: {
    host: "hostName",
    viewers: {
      user1: "value1",
      user2: "value2",
      user3: "value3",
    },
  },
};

var i;

for (i = 4; i <= 8; i++) {
  var newUser = "user" + i;
  console.log("newUser", newUser);

  var newValue = "value" + i;
  jsonObj.members.viewers[newUser] = newValue;
}

console.log(jsonObj);

let timeLine = {};
// Get the user TimeLine from Redis
client.hgetall(`User:${req.params.userName}`, (err, posts) => {
  if (err) return next(new ErrorResponse("Error get Cached post.", 500));

  for (const post in posts) {
    if (posts.hasOwnProperty(post)) {
      const element = posts[post];
      timeLine[post] = JSON.parse(element);
    }
  }

  res.status(200).json({
    success: true,
    timeLine,
  });
});
