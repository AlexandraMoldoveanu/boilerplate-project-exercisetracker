import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createUser, getUsers, addExercise, getUserLog } from "./db.js";

dotenv.config();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(new URL("./views/index.html", import.meta.url).pathname);
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

app.post("/api/users", async (req, res) => {
  const { username } = req.body;

  try {
    const id = await createUser(username);
    res.json({ id, username });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/users/:id/exercises", async (req, res) => {
  const { id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({
      error: "description and duration are required fields",
    });
  }

  try {
    const newExercise = await addExercise(id, description, duration, date);

    const response = {
      userId: id,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date,
    };

    res.json(response);
  } catch (error) {
    console.error("Error adding exercise:", error);
    res.status(500).json({ error: "Failed to add exercise" });
  }
});

app.get("/api/users/:id/logs", async (req, res) => {
  const { id } = req.params;
  const { from, to, limit } = req.query;
  try {
    const userLog = await getUserLog(id, from, to, limit);
    res.json(userLog);
  } catch (err) {
    console.error("Error getting the user log:", err);
    res.status(500).json({ error: "Failed to retrieve user log" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
