const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Users = require("./models/Usersmodel");
const Exercises = require("./models/Exercisesmodel");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async function (req, res) {
  const inputUsername = req.body.username;
  console.log("debug 1");
  // Create a new user
  let newUser = new Users({ username: inputUsername });
  console.log("debug 2");
  // save the user to the database
  const savedUser = await newUser.save();
  console.log("created");
  if (!savedUser) {
    return res.json({ message: "User creation failed!" });
  }
  res.json(savedUser);
});
// Get all the users
app.get("/api/users", async function (req, res) {
  const user = await Users.find({});
  if (!user) {
    return res.json({ message: "There are no users in the database!" });
  }
  res.json(user);
});
// post a new exercise
app.post("/api/users/:_id/exercises", async function (req, res) {
  var userId = req.params._id;
  var description = req.body.description;
  var duration = req.body.duration;
  var date = req.body.date;

  // Check for date
  if (!date) {
    date = new Date().toISOString().substring(0, 10);
  }
  // Find the user
  const user = await Users.findById(userId);
  if (!user) {
    return res.json({
      message: "There are no users with that ID in the database!",
    });
  }
  // Create new exercise
  let newExercise = new Exercises({
    userId: user._id,
    username: user.username,
    description: description,
    duration: parseInt(duration),
    date: date,
  });
  // Save the exercise to the database
  const savedExercise = await newExercise.save();
  if (!savedExercise) {
    return res.json({ message: "Exercise creation failed!" });
  }
  res.json({
    username: user.username,
    description: savedExercise.description,
    duration: savedExercise.duration,
    date: new Date(savedExercise.date).toDateString(),
    _id: user._id,
  });
});

// Get all the exercises of a user
app.get("/api/users/:_id/exercises", function (req, res) {
  res.redirect("/api/users/" + req.params._id + "/logs");
});
// Get all the logs of a user
app.get("/api/users/:_id/logs", async function (req, res) {
  const userId = req.params._id;
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
  const to =
    req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
  const limit = Number(req.query.limit) || 0;

  console.log("get user log");

  // Find the user
  let user = await Users.findById(userId).exec();

  // Find the exercises
  let exercises = await Exercises.find({
    userId: userId,
    date: { $gte: from, $lte: to },
  })
    .select("description duration date")
    .limit(limit)
    .exec();

  let parsedDatesLog = exercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString(),
    };
  });

  res.json({
    _id: user._id,
    username: user.username,
    count: parsedDatesLog.length,
    log: parsedDatesLog,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
