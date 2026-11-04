require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const JWKS = createRemoteJWKSet(new URL(`${CLIENT_URL}/api/auth/jwks`));

let books, borrows;
async function init() {
  await client.connect();
  const db = client.db(process.env.DB_NAME || "booknook");
  books = db.collection("books");
  borrows = db.collection("borrows");
  console.log("MongoDB connected");
}

// ---- JWT check (BetterAuth jwt plugin token) ----
async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).send({ message: "Unauthorized: token missing" });
    const { payload } = await jwtVerify(token, JWKS);
    req.user = { email: payload.email, name: payload.name, id: payload.id || payload.sub };
    next();
  } catch (e) {
    res.status(401).send({ message: "Unauthorized: invalid token" });
  }
}
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: "Something went wrong on the server" });
});

init().then(() => app.listen(PORT, () => console.log(`Server on ${PORT}`))).catch(console.error);
module.exports = app;
