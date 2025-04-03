const mongoose = require("mongoose");

var UsersSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
});

module.exports = mongoose.model("User", UsersSchema);
