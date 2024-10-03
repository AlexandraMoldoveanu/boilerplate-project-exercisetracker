import { Database } from "sqlite-async";
import { ObjectId } from "bson";

const DB_FILE = "./db.db";

export async function openDb() {
  return Database.open(DB_FILE);
}

const db = await openDb();

process.on("SIGINT", async () => {
  if (db) {
    await db.close();
    console.log("Database connection closed.");
  }
  process.exit(0);
});

export async function createUser(username) {
  if (!username || username.trim() === "") {
    const error = new Error("Username is required");
    error.status = 400;
    throw error;
  }

  const existingUser = await db.get("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  if (existingUser) {
    const error = new Error("Username already exists");
    error.status = 409;
    throw error;
  }

  const id = new ObjectId().toString();
  await db.run("INSERT INTO users (id, username) VALUES (?, ?)", [
    id,
    username,
  ]);

  return id;
}

export async function getUsers() {
  const users = await db.all("SELECT * FROM users");

  return users;
}

export async function getUserById(id) {
  const user = await db.get("SELECT * FROM users WHERE id = ? ", [id]);
  console.log(user);

  return user;
}

export async function getUserExercises(id, from, to, limit) {
  let query = "SELECT * FROM exercises WHERE userId = ?";
  const params = [id];

  if (from) {
    query += " AND date >= ?";
    params.push(new Date(from).toISOString().slice(0, 10));
  }

  if (to) {
    query += " AND date <= ?";
    params.push(new Date(to).toISOString().slice(0, 10));
  }

  if (limit) {
    query += " LIMIT ?";
    params.push(parseInt(limit));
  }

  const userExercises = await db.all(query, params);

  const formattedExercises = userExercises.map((exercise) => ({
    ...exercise,
    date: new Date(exercise.date).toDateString(),
  }));

  return formattedExercises;
}

export async function getUserLog(userId, from, to, limit) {
  const { username, id } = await getUserById(userId);
  const exercises = await getUserExercises(userId, from, to, limit);

  return {
    username,
    count: exercises.length,
    id,
    log: exercises,
  };
}

export async function addExercise(userId, description, duration, date) {
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (description.trim() === "") {
    const error = new Error("Description is required ");
    error.status = 400;
    throw error;
  }

  if (!duration || isNaN(duration) || parseInt(duration) <= 0) {
    const error = new Error("Duration should be a positive number");
    error.status = 400;
    throw error;
  }
  const foundUser = await getUserById(userId);

  const id = new ObjectId().toString();

  const exerciseDate = date
    ? new Date(date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  await db.run(
    "INSERT INTO exercises (id, userId, description, duration, date) VALUES (?, ?, ?, ?, ?)",
    [id, userId, description, parseInt(duration), exerciseDate]
  );

  const formattedDate = new Date(exerciseDate).toDateString();

  return { description, duration: parseInt(duration), date: formattedDate };
}
