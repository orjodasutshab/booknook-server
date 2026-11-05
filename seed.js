// Run once:  node seed.js
// Adds 20 more books directly to MongoDB (no extra API route needed).
require("dotenv").config();
const { MongoClient } = require("mongodb");

const OWNER = { name: process.env.SEED_NAME || "BookNook Admin", email: process.env.SEED_EMAIL || "orjodasutshab@duck.com" };

// [title, author, category, copies, description, colour]
const list = [
  ["Pather Panchali", "Bibhutibhushan Bandyopadhyay", "Fiction", 3, "The moving story of Apu and Durga growing up in a poor Bengali village.", "7c3aed"],
  ["Lalsalu", "Syed Waliullah", "Fiction", 2, "A village caretaker of a shrine and the struggle of faith against power.", "b91c1c"],
  ["Padma Nadir Majhi", "Manik Bandopadhyay", "Fiction", 3, "Life of the fishermen along the river Padma, told with deep honesty.", "0e7490"],
  ["Deyal", "Humayun Ahmed", "Fiction", 4, "A mysterious and gripping novel from the most loved writer of Bangladesh.", "15803d"],
  ["The Alchemist", "Paulo Coelho", "Fiction", 5, "A shepherd boy follows his dream across the desert to find his treasure.", "ca8a04"],
  ["1984", "George Orwell", "Fiction", 3, "A chilling story of surveillance, truth and control in a totalitarian state.", "374151"],
  ["Animal Farm", "George Orwell", "Fiction", 4, "Farm animals rise against their owner, but power soon corrupts them.", "be123c"],
  ["Sherlock Holmes: Selected Stories", "Arthur Conan Doyle", "Fiction", 3, "Classic detective cases solved by the sharp mind of Sherlock Holmes.", "1e40af"],
  ["A Brief History of Time", "Stephen Hawking", "Science", 2, "From the Big Bang to black holes, explained for everyday readers.", "0f766e"],
  ["Cosmos", "Carl Sagan", "Science", 3, "A beautiful journey through the universe and our place inside it.", "4338ca"],
  ["The Selfish Gene", "Richard Dawkins", "Science", 2, "A famous look at evolution from the point of view of the gene.", "65a30d"],
  ["Astrophysics for People in a Hurry", "Neil deGrasse Tyson", "Science", 4, "The big ideas of the cosmos in short and easy chapters.", "7e22ce"],
  ["Sapiens", "Yuval Noah Harari", "History", 4, "A brief history of humankind from the Stone Age to today.", "c2410c"],
  ["The Diary of a Young Girl", "Anne Frank", "History", 3, "The real diary of a young girl hiding during the Second World War.", "a16207"],
  ["Bangabandhu: Oshomapto Attojiboni", "Sheikh Mujibur Rahman", "History", 2, "The unfinished memoirs that tell the story of a nation's leader.", "166534"],
  ["Guns, Germs, and Steel", "Jared Diamond", "History", 2, "Why some societies grew powerful while others did not.", "9f1239"],
  ["Thakurmar Jhuli", "Dakshinaranjan Mitra Majumder", "Kids", 5, "Beloved Bengali fairy tales of kings, queens, demons and clever animals.", "db2777"],
  ["Harry Potter and the Philosopher's Stone", "J.K. Rowling", "Kids", 5, "A boy finds out he is a wizard and starts school at Hogwarts.", "b45309"],
  ["The Little Prince", "Antoine de Saint-Exupéry", "Kids", 4, "A gentle tale about a prince who travels from planet to planet.", "0369a1"],
  ["Atomic Habits", "James Clear", "Others", 5, "Small daily habits that lead to remarkable long-term results.", "ea580c"],
];

const cover = (t, c) =>
  `https://placehold.co/400x600/${c}/ffffff/png?font=playfair-display&text=${encodeURIComponent(t.replace(/(.{1,14})(\s|$)/g, "$1\n").trim())}`;

(async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const col = client.db(process.env.DB_NAME || "booknook").collection("books");
  const now = Date.now();
  const docs = [];
  for (let i = 0; i < list.length; i++) {
    const [title, author, category, copies, description, colour] = list[i];
    if (await col.findOne({ title })) { console.log("skip (exists):", title); continue; }
    docs.push({
      title, author, category, description,
      image: cover(title, colour),
      totalCopies: copies, availableCopies: copies,
      addedBy: OWNER,
      createdAt: new Date(now - (list.length - i) * 60000),
    });
  }
  if (docs.length) await col.insertMany(docs);
  console.log(`Inserted ${docs.length} books`);
  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
