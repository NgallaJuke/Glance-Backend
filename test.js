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
