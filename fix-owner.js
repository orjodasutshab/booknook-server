// Usage: node fix-owner.js old@email.com new@email.com "New Name"
// Moves all books (and borrow records) from the old email to the new owner.
require("dotenv").config();
const { MongoClient } = require("mongodb");

const [oldEmail, newEmail, newName] = process.argv.slice(2);
if (!oldEmail || !newEmail || !newName) {
  console.log('Usage: node fix-owner.js old@email.com new@email.com "New Name"');
  process.exit(1);
}

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME || "booknook");
  const r = await db.collection("books").updateMany(
    { "addedBy.email": oldEmail },
    { $set: { "addedBy.email": newEmail, "addedBy.name": newName } }
  );
  console.log(`Done. ${r.modifiedCount} book(s) updated.`);
  await client.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
