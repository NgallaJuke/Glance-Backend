// const crypto = require("crypto");
// // base64 encode the data
// function bs64encode(data) {
//   if (typeof data === "object") {
//     data = JSON.stringify(data);
//   }

//   return bs64escape(Buffer.from(data).toString("base64"));
// }

// // modify the base64 string to be URL safe
// function bs64escape(string) {
//   return string.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
// }

// // base64 encode the header
// let bs64header = bs64encode({
//   alg: "HS256",
//   typ: "JWT",
// });

// console.log("bs64header :>>\n ", bs64header);

// // base64 encode the payload
// let bs64payload = bs64encode({
//   id: "5eb20004ac94962628c68b91",
//   iat: 1589125343,
//   exp: 1589989343,
//   jti: "37743739b1476caa18ca899c7bc934e1aba63ba1",
// });

// console.log("bs64payload :>> \n", bs64payload);

// // generate the signature from the header and payload
// let secret = "0d528cb666023eee0d44e725fe9dfb751263d2f68f07998ae7388ff43b1b504f";
// let signature = bs64header + "." + bs64payload;

// let bs64signature = bs64escape(
//   crypto.createHmac("sha256", secret).update(signature).digest("base64")
// );

// console.log("bs64signature>>", bs64signature);

// let jwt = bs64header + "." + bs64payload + "." + bs64signature;

// console.log("jwt>>", jwt);

console.log(Date.now() / 1000);
