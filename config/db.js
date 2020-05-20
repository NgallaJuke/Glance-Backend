const mongoose = require("mongoose");

const DBconnect = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  if (!conn) {
    console.log("Can not connect to Database".red);
  } else {
    console.log(`MongoDB Connected: ${conn.connection.host}`.yellow.bold);
  }
};
module.exports = DBconnect;
