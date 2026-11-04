# BookNook Server

Express + MongoDB API for BookNook. JWT tokens are issued by BetterAuth (client) and verified here via the client's JWKS endpoint.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill values
3. `npm run dev`

## Routes
| Method | Route | Auth |
|---|---|---|
| GET | /books (`?limit=6&sort=latest`, `?mine=true`) | public / JWT for mine |
| GET | /books/:id | public |
| POST | /books | JWT |
| PATCH | /books/:id | JWT (owner) |
| DELETE | /books/:id | JWT (owner) |
| POST | /borrows | JWT |
| GET | /borrows | JWT |
| DELETE | /borrows/:id | JWT |
