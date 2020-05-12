const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Notification creator
  receiver: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Ids of the receivers of the notification
  message: String, // any description of the notification message
  read_by: [
    {
      readerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      read_at: { type: Date, default: Date.now },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", NotificationSchema);
