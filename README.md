<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=250&color=gradient&customColorList=2,12,20&section=header&text=BookNook%20Server&fontSize=64&fontColor=ffffff&fontAlignY=38&desc=Express%20%2B%20MongoDB%20API%20with%20JWT%20protection&descSize=22&descAlignY=60&animation=fadeIn" alt="BookNook Server banner" width="100%" />

<a href="https://github.com/orjodasutshab/booknook-server">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1200&color=06B6D4&center=true&vCenter=true&width=640&lines=8+clean+REST+API+routes;JWT+verified+with+BetterAuth+JWKS;Copies+tracked+with+MongoDB+%24inc;No+double+borrow+protection" alt="Typing animation" />
</a>

<br/>

### 🌐 Live API: [https://booknook-server-omega.vercel.app](https://booknook-server-omega.vercel.app)

<br/>

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---

## 📖 About

This is the backend of **BookNook**, a small online library where users add, borrow and return books.

Login tokens are issued by BetterAuth on the Next.js client. This server checks every protected request by verifying the token against the client's **JWKS endpoint** using `jose`.

🔗 **Client repository:** [orjodasutshab/BookNook](https://github.com/orjodasutshab/BookNook)

---

## ✨ Key Features

- 🔐 **JWT protected routes**: tokens are verified with the client's JWKS, so no secret is shared.
- 👤 **Owner-only changes**: only the person who added a book can update or delete it.
- 📚 **Newest-first listing** using MongoDB `sort` and `limit` (used for New Arrivals).
- 🔁 **Live copy count**: `$inc` lowers the available copies on borrow and raises them on return.
- 🚫 **No double borrow**: the same user cannot borrow the same book twice at the same time.
- ⛔ **No borrow at zero copies**: the server refuses the request when no copy is left.
- 🧱 **Central error handling** that returns clear JSON messages the client shows as toasts.

---

## 🔌 API Routes

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/books` | Public | Get all books. Supports `?limit=6&sort=latest` and `?mine=true` (JWT) |
| `GET` | `/books/:id` | Public | Get one book |
| `POST` | `/books` | 🔒 JWT | Add a new book |
| `PATCH` | `/books/:id` | 🔒 JWT (owner) | Update a book |
| `DELETE` | `/books/:id` | 🔒 JWT (owner) | Delete a book |
| `POST` | `/borrows` | 🔒 JWT | Borrow a book |
| `GET` | `/borrows` | 🔒 JWT | Get the borrows of the logged in user |
| `DELETE` | `/borrows/:id` | 🔒 JWT | Return a book |

Protected requests need this header:

```
Authorization: Bearer <jwt-token>
```

---

## 🗃️ Data Collections

**books**

```json
{
  "title": "The Alchemist",
  "author": "Paulo Coelho",
  "category": "Fiction",
  "image": "https://...",
  "description": "A shepherd boy follows his dream...",
  "totalCopies": 5,
  "availableCopies": 5,
  "addedBy": { "name": "Orjo Das Utshab", "email": "user@example.com" },
  "createdAt": "2026-11-05T10:00:00.000Z"
}
```

**borrows**

```json
{
  "bookId": "...",
  "bookTitle": "The Alchemist",
  "bookImage": "https://...",
  "userEmail": "user@example.com",
  "borrowDate": "2026-11-05",
  "returnDate": "2026-11-12"
}
```

---

## 🧰 Tech Stack

| Tool | Use |
|---|---|
| Node.js and Express | Server and routing |
| MongoDB (official driver) | Database |
| jose | JWT verification with a remote JWKS |
| cors | Allow requests from the client |
| dotenv | Environment variables |

---

## 🚀 Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/orjodasutshab/booknook-server.git
cd booknook-server
```

**2. Install packages**

```bash
npm install
```

**3. Create a `.env` file** (copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/booknook
DB_NAME=booknook
CLIENT_URL=http://localhost:3000
```

**4. Start the server**

```bash
npm run dev
```

The API runs at [http://localhost:5000](http://localhost:5000). Open the root URL and you will see: `BookNook server is running`.

---

<div align="center">

### 👨‍💻 Made by **Orjo Das Utshab**

[![GitHub](https://img.shields.io/badge/GitHub-orjodasutshab-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/orjodasutshab)

<img src="https://capsule-render.vercel.app/api?type=waving&height=120&color=gradient&customColorList=2,12,20,24&section=footer" width="100%" alt="footer" />

</div>
