import { Database } from "sqlite-async";
import { ObjectId } from "bson";

const DB_FILE = "./db.db";

export async function openDb() {
  return Database.open(DB_FILE);
}

export async function createUser(username) {
  const db = await openDb();

  const id = new ObjectId().toString();
  await db.run("INSERT INTO users (id, username) VALUES (?, ?)", [
    id,
    username,
  ]);
  await db.close();
  return id;
}

export async function getUsers() {
  const db = await openDb();
  const users = await db.all("SELECT * FROM users");
  await db.close();
  return users;
}

export async function getUserById(id) {
  const db = await openDb();
  const user = await db.get("SELECT * FROM users WHERE id = ? ", [id]);
  console.log(user);
  await db.close();
  return user;
}

export async function getUserExercises(id, from, to, limit) {
  const db = await openDb();

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
  await db.close();

  const formattedExercises = userExercises.map((exercise) => ({
    ...exercise,
    date: new Date(exercise.date).toDateString(),
  }));

  return formattedExercises;
}

export async function getUserLog(userId, from, to, limit) {
  const db = await openDb();
  const { username, id } = await getUserById(userId);
  const exercises = await getUserExercises(userId, from, to, limit);
  await db.close();
  return {
    username,
    count: exercises.length,
    id,
    log: exercises,
  };
}

export async function addExercise(userId, description, duration, date) {
  const db = await openDb();
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
