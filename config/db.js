const mongoose = require("mongoose");

const DBconnect = async () => {
  const DB_connection = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  if (!DB_connection) {
    console.log("ERROR: Database Connection".red);
  } else {
    console.log(
      `SUCCESS:`.yellow +
        `MongoDB connected to ${DB_connection.connection.host}`.blue.bold
    );
  }
};
module.exports = DBconnect;
