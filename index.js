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

const validId = (id) => ObjectId.isValid(id);
const bookFields = (b) => ({
  title: String(b.title || "").trim(),
  author: String(b.author || "").trim(),
  category: b.category,
  image: b.image,
  description: String(b.description || "").trim(),
});

app.get("/", (_, res) => res.send("BookNook server is running"));

// 1. GET /books (public). ?limit=6&sort=latest ; ?mine=true (needs token)
app.get("/books", async (req, res, next) => {
  try {
    const { limit, sort, mine } = req.query;
    const run = async (filter = {}) => {
      let cursor = books.find(filter);
      if (sort === "latest" || mine === "true") cursor = cursor.sort({ createdAt: -1 });
      if (limit) cursor = cursor.limit(Math.min(parseInt(limit) || 0, 100));
      res.send(await cursor.toArray());
    };
    if (mine === "true") {
      return verifyToken(req, res, () => run({ "addedBy.email": req.user.email }).catch(next));
    }
    await run();
  } catch (e) { next(e); }
});

// 2. GET /books/:id
app.get("/books/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).send({ message: "Invalid book id" });
    const book = await books.findOne({ _id: new ObjectId(req.params.id) });
    if (!book) return res.status(404).send({ message: "Book not found" });
    res.send(book);
  } catch (e) { next(e); }
});

// 3. POST /books
app.post("/books", verifyToken, async (req, res, next) => {
  try {
    const data = bookFields(req.body);
    const total = parseInt(req.body.totalCopies);
    if (!data.title || !data.author || !data.category || !data.image || !data.description || !(total >= 1)) {
      return res.status(400).send({ message: "All fields are required (copies must be 1 or more)" });
    }
    const doc = {
      ...data,
      totalCopies: total,
      availableCopies: total,
      addedBy: { name: req.user.name, email: req.user.email },
      createdAt: new Date(),
    };
    const result = await books.insertOne(doc);
    res.status(201).send({ ...result, book: doc });
  } catch (e) { next(e); }
});

// 4. PATCH /books/:id (owner only)
app.patch("/books/:id", verifyToken, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).send({ message: "Invalid book id" });
    const _id = new ObjectId(req.params.id);
    const book = await books.findOne({ _id });
    if (!book) return res.status(404).send({ message: "Book not found" });
    if (book.addedBy.email !== req.user.email) return res.status(403).send({ message: "Forbidden" });

    const data = bookFields({ ...book, ...req.body });
    const update = { ...data };
    if (req.body.totalCopies !== undefined) {
      const total = parseInt(req.body.totalCopies);
      const borrowed = book.totalCopies - book.availableCopies;
      if (!(total >= borrowed && total >= 1)) {
        return res.status(400).send({ message: `Total copies cannot be less than currently borrowed (${borrowed})` });
      }
      update.totalCopies = total;
      update.availableCopies = total - borrowed;
    }
    await books.updateOne({ _id }, { $set: update });
    res.send({ modifiedCount: 1 });
  } catch (e) { next(e); }
});

// 5. DELETE /books/:id (owner only)
app.delete("/books/:id", verifyToken, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).send({ message: "Invalid book id" });
    const _id = new ObjectId(req.params.id);
    const book = await books.findOne({ _id });
    if (!book) return res.status(404).send({ message: "Book not found" });
    if (book.addedBy.email !== req.user.email) return res.status(403).send({ message: "Forbidden" });
    await books.deleteOne({ _id });
    await borrows.deleteMany({ bookId: req.params.id });
    res.send({ deletedCount: 1 });
  } catch (e) { next(e); }
});

// 6. POST /borrows
app.post("/borrows", verifyToken, async (req, res, next) => {
  try {
    const { bookId, returnDate } = req.body;
    if (!validId(bookId)) return res.status(400).send({ message: "Invalid book id" });
    const rd = new Date(returnDate);
    if (!returnDate || isNaN(rd) || rd <= new Date()) {
      return res.status(400).send({ message: "Please choose a valid future return date" });
    }
    const existing = await borrows.findOne({ bookId, userEmail: req.user.email });
    if (existing) return res.status(409).send({ message: "You have already borrowed this book" });

    const updated = await books.findOneAndUpdate(
      { _id: new ObjectId(bookId), availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(409).send({ message: "This book is not available right now" });

    const doc = {
      bookId,
      bookTitle: updated.title,
      bookImage: updated.image,
      userName: req.user.name,
      userEmail: req.user.email,
      borrowDate: new Date(),
      returnDate: rd,
    };
    const result = await borrows.insertOne(doc);
    res.status(201).send(result);
  } catch (e) { next(e); }
});

// 7. GET /borrows (logged in user)
app.get("/borrows", verifyToken, async (req, res, next) => {
  try {
    res.send(await borrows.find({ userEmail: req.user.email }).sort({ borrowDate: -1 }).toArray());
  } catch (e) { next(e); }
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: "Something went wrong on the server" });
});

init().then(() => app.listen(PORT, () => console.log(`Server on ${PORT}`))).catch(console.error);
module.exports = app;
