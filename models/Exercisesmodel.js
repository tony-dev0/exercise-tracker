const mongoose = require("mongoose");

var exercisesSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, min: 1, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Exercise", exercisesSchema);
