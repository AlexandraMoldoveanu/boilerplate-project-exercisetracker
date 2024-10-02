const express = require("express");
const app = express();
const cors = require("cors");
const { ObjectId } = require("bson");
require("dotenv").config();

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));

let users = [];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
  res.json(users.map((user) => ({ username: user.username, id: user.id })));
});

app.post("/api/users", (req, res) => {
  const { username } = req.body;

  const newUser = {
    username: username,
    id: new ObjectId().toString(),
    exercises: [],
  };
  users.push(newUser);

  res.json({ username: newUser.username, id: newUser.id });
});

app.post("/api/users/:id/exercises", (req, res) => {
  const { id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({
      error: "description and duration are required fields",
    });
  }
  console.log(id, "id");
  console.log("users", users);
  const foundUser = users.find((user) => user.id === id);

  if (!foundUser) {
    return res.status(404).send("User not found");
  }

  const newExercise = {
    description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString(),
  };

  foundUser.exercises.push(newExercise);

  const response = {
    username: foundUser.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date,
    id: foundUser.id,
  };

  res.json(response);
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const foundUser = users.find((user) => user.id === _id);

  if (!foundUser) {
    return res.status(404).send("User not found");
  }

  let filteredExercises = [...foundUser.exercises];

  if (from) {
    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: "Invalid 'from' date" });
    }
    filteredExercises = filteredExercises.filter((exercise) => {
      const exerciseDate = new Date(exercise.date);
      return exerciseDate >= fromDate;
    });
  }

  if (to) {
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "Invalid 'to' date" });
    }
    filteredExercises = filteredExercises.filter((exercise) => {
      const exerciseDate = new Date(exercise.date);
      return exerciseDate <= toDate;
    });
  }

  if (limit) {
    filteredExercises = filteredExercises.slice(0, parseInt(limit));
  }

  const response = {
    username: foundUser.username,
    count: filteredExercises.length,
    _id: foundUser.id,
    log: filteredExercises,
  };

  res.json(response);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
