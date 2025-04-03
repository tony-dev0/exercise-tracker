const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const Users = require("./models/Usersmodel");
const Exercises = require("./models/Usersmodel");

mongoose.connect(process.env.MONGO_URI);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", function (req, res) {
  if (req.body.username === "") {
    return res.json({ error: "username is required" });
  }

  let username = req.body.username;
  let _id = "";

  Users.findOne({ username: username }, function (err, data) {
    if (!err && data === null) {
      let newUser = new Users({
        username: username,
      });

      newUser.save(function (err, data) {
        if (!err) {
          _id = data["_id"];

          return res.json({
            _id: _id,
            username: username,
          });
        }
      });
    } else {
      return res.json({ error: "username already exists" });
    }
  });
});

app.get("/api/users", function (req, res) {
  Users.find({}, function (err, data) {
    if (!err) return res.json(data);
  });
});

app.post("/api/users/:_id/exercises", function (req, res) {
  if (req.params._id === "0") {
    return res.json({ error: "_id is required" });
  }

  if (req.body.description === "") {
    return res.json({ error: "description is required" });
  }

  if (req.body.duration === "") {
    return res.json({ error: "duration is required" });
  }

  let userId = req.params._id;
  let description = req.body.description;
  let duration = parseInt(req.body.duration);
  let date = req.body.date !== undefined ? new Date(req.body.date) : new Date();

  if (isNaN(duration)) {
    return res.json({ error: "duration is not a number" });
  }

  if (date == "Invalid Date") {
    return res.json({ error: "date is invalid" });
  }

  Users.findById(userId, function (err, data) {
    if (!err && data !== null) {
      let newExercise = new Exercises({
        userId: userId,
        description: description,
        duration: duration,
        date: date,
      });

      newExercise.save(function (err2, data2) {
        if (!err2) {
          return res.json({
            _id: data["_id"],
            username: data["username"],
            description: data2["description"],
            duration: data2["duration"],
            date: new Date(data2["date"]).toDateString(),
          });
        }
      });
    } else {
      return res.json({ error: "user not found" });
    }
  });
});
//
app.get("/api/users/:_id/exercises", function (req, res) {
  res.redirect("/api/users/" + req.params._id + "/logs");
});

app.get("/api/users/:_id/logs", async function (req, res) {
  const userId = req.params._id;
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
  const to =
    req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
  const limit = Number(req.query.limit) || 0;

  console.log("get user log");

  //? Find the user
  let user = await Users.findById(userId).exec();

  console.log(
    "looking for exercises with id [".toLocaleUpperCase() + userId + "] ..."
  );

  //? Find the exercises
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
