import { Database } from "sqlite-async";
import { ObjectId } from "bson";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

import { isNumber, isDateValid } from "./validation.js";

dayjs.extend(customParseFormat);

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
  const users = await db.all("SELECT * FROM users ");

  return users;
}

export async function getUserById(id) {
  const foundUser = await db.get("SELECT * FROM users WHERE id = ? ", [id]);
  if (!foundUser) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return foundUser;
}

export async function getUserExercises(id, from, to) {
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

  query += " ORDER BY date";

  const userExercises = await db.all(query, params);

  const formattedExercises = userExercises.map((exercise) => ({
    ...exercise,
    date: new Date(exercise.date).toDateString(),
  }));

  return formattedExercises;
}

export async function getUserLog(userId, from, to, limit) {
  const foundUser = await getUserById(userId);

  const { username, id } = foundUser;

  if (limit && (parseInt(limit) < 0 || !isNumber(limit))) {
    const error = new Error("Limit should be a positive number");
    error.status = 400;
    throw error;
  }

  if (from && !isDateValid(from)) {
    const error = new Error(
      "Invalid query. Please use one of the following formats: 'YYYY-MM-DD', 'MM/DD/YYYY', or 'DD-MM-YYYY'."
    );
    error.status = 400;
    throw error;
  }
  if (to && !isDateValid(to)) {
    const error = new Error(
      "Invalid query. Please use one of the following formats: 'YYYY-MM-DD', 'MM/DD/YYYY', or 'DD-MM-YYYY'."
    );
    error.status = 400;
    throw error;
  }
  const exercises = await getUserExercises(userId, from, to);

  return {
    username,
    count: exercises.length,
    id,
    log: limit ? exercises.slice(0, parseInt(limit)) : exercises,
  };
}

export async function addExercise(userId, description, duration, date) {
  await getUserById(userId);

  if (description.trim() === "") {
    const error = new Error("Description is required ");
    error.status = 400;
    throw error;
  }

  if (!isNumber(duration) || parseInt(duration) <= 0) {
    const error = new Error("Duration should be a positive number");
    error.status = 400;
    throw error;
  }

  let exerciseDate;
  if (date) {
    if (!isDateValid(date)) {
      const error = new Error(
        "Invalid date. Please use one of the following formats: 'YYYY-MM-DD', 'MM/DD/YYYY', or 'DD-MM-YYYY'."
      );
      error.status = 400;
      throw error;
    }
    exerciseDate = dayjs(date).format("YYYY-MM-DD");
  } else {
    exerciseDate = dayjs().format("YYYY-MM-DD");
  }

  const id = new ObjectId().toString();
  await db.run(
    "INSERT INTO exercises (id, userId, description, duration, date) VALUES (?, ?, ?, ?, ?)",
    [id, userId, description, parseInt(duration), exerciseDate]
  );
  const formattedDate = dayjs(exerciseDate).format("ddd MMM DD YYYY");
  return { description, duration: parseInt(duration), date: formattedDate };
}
