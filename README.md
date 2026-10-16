# COMP3123 Assignment 1 — Secure Employee Management API

**Student:** Amran (101563789) · **Course:** COMP 3123 Full Stack Development I · George Brown College

A secure RESTful backend built with **Node.js, Express and MongoDB (Mongoose)**. Users sign up, log in to receive a JWT, and manage **their own** employees. Every employee belongs to the user who created it, and no user can read, change or delete another user's employees.

- **Live API (Vercel):** `https://YOUR-PROJECT.vercel.app` _(replace after deploying)_
- **Health check:** `GET /health`
- **Postman collection:** [`postman/COMP3123_Assignment1.postman_collection.json`](postman/COMP3123_Assignment1.postman_collection.json)

---

## Technologies

| Area | Package |
| --- | --- |
| Runtime / framework | Node.js 18+, Express 5 (Express Router) |
| Database | MongoDB (Atlas or local), Mongoose 9 — database `comp3123_assignment1` |
| Authentication | `jsonwebtoken` (HS256 JWT), `bcryptjs` password hashing |
| Validation | `express-validator` |
| Security | `helmet`, `express-rate-limit`, `cors`, environment variables via `dotenv` |
| Logging | `winston` (JSON log files) |
| Testing | Postman / Newman |
| Hosting | Vercel (serverless function in `api/index.js`) |

## Project structure

```
├── api/index.js              # Vercel entry point (exports the Express app)
├── server.js                 # Local entry point: connects DB, starts listening
├── vercel.json               # Routes every path to the serverless function
├── src/
│   ├── app.js                # Express app: helmet, cors, logging, routers, error handling
│   ├── config/
│   │   ├── env.js            # Loads + validates environment variables
│   │   └── db.js             # Cached Mongoose connection, DB status for /health
│   ├── models/
│   │   ├── User.js           # username, email, hashed password, timestamps
│   │   └── Employee.js       # employee fields + `user` (owner, ref User)
│   ├── routes/               # userRoutes, employeeRoutes, healthRoutes
│   ├── controllers/          # HTTP layer: read request, send status + JSON
│   ├── services/             # Business logic: userService, employeeService, tokenService
│   ├── validators/           # express-validator rule sets
│   ├── middleware/
│   │   ├── auth.js           # JWT verification (Bearer token)
│   │   ├── validate.js       # Turns validation results into 400 responses
│   │   ├── rateLimiters.js   # signup / login / general API limiters
│   │   ├── requestLogger.js  # One log line per request
│   │   ├── ensureDb.js       # Connects to MongoDB before DB routes (serverless)
│   │   └── errorHandler.js   # 404 + centralized JSON error handler
│   └── utils/                # logger, ApiError, asyncHandler
├── postman/                  # Collection + local and Vercel environments
├── logs/sample/              # Example log output (real logs are git-ignored)
└── .env.example
```

Request flow: **route → (rate limiter) → auth middleware → validator → controller → service → Mongoose model**, with any error passed to the central error handler.

---

## Installation

1. **Clone**
   ```bash
   git clone https://github.com/Swiper-kh/101563789_COMP3123_Assignment1.git
   cd 101563789_COMP3123_Assignment1
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables**
   ```bash
   cp .env.example .env      # Windows: copy .env.example .env
   ```
   Then set `MONGODB_URI` and a long random `JWT_SECRET` in `.env`.
4. **Start MongoDB** — either run MongoDB locally (`mongod`, or MongoDB Compass with a local server on `mongodb://127.0.0.1:27017`), or create a free MongoDB Atlas cluster and paste its connection string into `MONGODB_URI`. The app always uses the database name `comp3123_assignment1`.
5. **Start the API**
   ```bash
   npm run dev     # with auto-reload (nodemon)
   npm start       # plain node
   ```
   You should see `MongoDB connected` and `Server started on port 3000`.
6. **Test the API**
   - Postman: import `postman/COMP3123_Assignment1.postman_collection.json` and `postman/local.postman_environment.json`, select the **COMP3123 A1 - Local** environment, and run the collection top-to-bottom (Collection Runner) or request-by-request.
   - Command line: `npm run test:api` (runs the same collection with Newman).

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | — | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | yes | — | Secret used to sign/verify JWTs |
| `PORT` | no | `3000` | Local port |
| `NODE_ENV` | no | `development` | `production` hides debug info in 500 responses |
| `JWT_EXPIRES_IN` | no | `1h` | Token lifetime (e.g. `15m`, `1h`) |
| `BCRYPT_SALT_ROUNDS` | no | `10` | bcrypt cost factor |
| `AUTH_RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_WINDOW_MIN` | no | `10` / `15` | Signup and login limits per IP |
| `API_RATE_LIMIT_MAX` / `API_RATE_LIMIT_WINDOW_MIN` | no | `100` / `15` | Limit for all `/api` routes per IP |
| `LOG_LEVEL` / `LOG_DIR` | no | `info` / `logs` (`/tmp/logs` on Vercel) | Logging |

The server refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing.

---

## API

Base paths: `/api/v1/user` and `/api/v1/emp`. All bodies are JSON. Errors always look like:

```json
{ "status": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Email format is invalid" }] }
```

| # | Method | Endpoint | Auth | Success | Purpose |
| - | --- | --- | --- | --- | --- |
| 1 | POST | `/api/v1/user/signup` | — | **201** | Register a user |
| 2 | POST | `/api/v1/user/login` | — | **200** | Log in with username **or** email; returns JWT |
| 3 | GET | `/api/v1/emp/employees` | Bearer | **200** | List the logged-in user's employees |
| 4 | POST | `/api/v1/emp/employees` | Bearer | **201** | Create an employee owned by the logged-in user |
| 5 | GET | `/api/v1/emp/employees/{eid}` | Bearer | **200** | Get one of the user's employees |
| 6 | PUT | `/api/v1/emp/employees/{eid}` | Bearer | **200** | Update one of the user's employees (partial update allowed) |
| 7 | DELETE | `/api/v1/emp/employees?eid=xxx` | Bearer | **204** | Delete one of the user's employees (empty body) |
| — | GET | `/health` | — | **200** | Health check |

### Examples

**Signup** `POST /api/v1/user/signup`
```json
{ "username": "usera", "email": "usera@example.com", "password": "Password123" }
```
→ `201`
```json
{ "status": true, "message": "User created successfully", "user_id": "6ad1...354a",
  "user": { "_id": "6ad1...354a", "username": "usera", "email": "usera@example.com", "created_at": "...", "updated_at": "..." } }
```
Rules: username 3–30 chars (letters, numbers, `_`, `.`), unique; email valid and unique; password 8–64 chars with an uppercase letter, a lowercase letter and a number.

**Login** `POST /api/v1/user/login` — either form works:
```json
{ "username": "usera", "password": "Password123" }
{ "email": "usera@example.com", "password": "Password123" }
```
→ `200`
```json
{ "status": true, "message": "Login successful", "token": "eyJhbGciOi...", "token_type": "Bearer", "expires_in": "1h", "user": { ... } }
```

**Create employee** `POST /api/v1/emp/employees` (header `Authorization: Bearer <token>`)
```json
{ "first_name": "Alice", "last_name": "Martin", "email": "alice.martin@example.com",
  "position": "Software Developer", "salary": 85000, "date_of_joining": "2025-03-15", "department": "Engineering" }
```
→ `201` `{ "status": true, "message": "Employee created successfully", "employee_id": "...", "employee": { ..., "user": "<your user id>" } }`

**Update employee** `PUT /api/v1/emp/employees/{eid}` → send any subset of the fields above, e.g. `{ "position": "Senior Software Developer", "salary": 95000 }`.

**Delete employee** `DELETE /api/v1/emp/employees?eid=<employee id>` → `204 No Content`.

### Status codes used

| Code | When |
| --- | --- |
| 200 OK | Successful login, read, update, health check |
| 201 Created | User or employee created |
| 204 No Content | Employee deleted |
| 400 Bad Request | Validation failure, malformed JSON, invalid/missing `eid`, unexpected fields |
| 401 Unauthorized | Wrong credentials, missing/malformed/invalid/expired JWT |
| 403 Forbidden | Employee exists but belongs to another user |
| 404 Not Found | Employee does not exist, unknown route |
| 409 Conflict | Username/email already registered; employee email already used by this user |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Unexpected server error (no stack trace is returned) |
| 503 Service Unavailable | Database unreachable (health check / DB routes) |

---

## Authentication

1. **Signup** stores the user with a bcrypt-hashed password.
2. **Login** looks the user up by `username` or `email`, compares the password with `bcrypt.compare`, and returns a **JWT** signed with `JWT_SECRET` (HS256). The token payload holds only the user id (`sub`) and username, and expires after `JWT_EXPIRES_IN`.
3. The client sends the token on every employee request:
   ```
   Authorization: Bearer <jwt>
   ```
4. `src/middleware/auth.js` runs on **all** `/api/v1/emp/*` routes. It rejects a missing header, a header that is not `Bearer <token>`, a token with a bad signature, and an expired token (each with `401` and a clear message). On success it sets `req.user = { id, username }` from the verified token.

Login failures always return the same message (`Invalid username/email or password`) whether the account exists or not, and a dummy bcrypt comparison runs for unknown users so response timing doesn't reveal which accounts exist.

## Authorization — users only see their own employees

- The `Employee` model has a required `user` field (`ObjectId`, `ref: 'User'`, indexed, immutable). It records **which user owns the employee**.
- On create, the owner is set from `req.user.id` (the verified JWT). The request body may **not** contain `user` or `_id` — validators reject unexpected fields with `400`, so a client cannot assign an employee to someone else.
- Every read/update/delete query is **scoped to the owner** in MongoDB itself:
  ```js
  Employee.find({ user: ownerId })
  Employee.findOne({ _id: eid, user: ownerId })
  Employee.findOneAndUpdate({ _id: eid, user: ownerId }, ...)
  Employee.deleteOne({ _id: eid, user: ownerId })
  ```
  Changing `eid` in the URL or query string therefore can't reach another user's record — the filter simply matches nothing.
- When the owner-scoped query matches nothing, the service checks whether the id exists at all: if it belongs to someone else the API answers **403 Forbidden**; if it doesn't exist, **404 Not Found**. The other user's data is never returned or modified.

The Postman folder **06 - Cross-user access** proves this with two users: User A's GET/PUT/DELETE on User B's employee and User B's GET/PUT/DELETE on User A's employee all return `403`, and a follow-up read confirms nothing changed.

## Security

| Measure | Implementation |
| --- | --- |
| Password hashing | `bcryptjs` with 10 salt rounds in a Mongoose `pre('save')` hook. The `password` field has `select: false` and is stripped in `toJSON`, so it is never returned. |
| JWT | HS256 only (algorithm pinned on verify), short expiry, secret from env. Identity comes only from the token. |
| Helmet | `app.use(helmet())` sets security headers such as `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy`, and removes `X-Powered-By`. These reduce clickjacking, MIME sniffing, XSS and information leakage. |
| Rate limiting | See below. |
| Input validation | `express-validator` on every body, param and query: required fields, types, lengths, email format, positive numeric salary, strict ISO dates, valid MongoDB ObjectIds, and no unexpected fields (prevents mass assignment). JSON bodies are capped at 10 kb. Mongoose schema constraints act as a second layer. |
| Environment variables | Secrets live in `.env` (git-ignored); `.env.example` documents them with placeholders. On Vercel they are set in Project Settings → Environment Variables. |
| Error responses | Centralized handler returns JSON only; no stack traces, secrets or DB details are exposed. |

### Rate limiting

Rate limiting caps how many requests one client (IP address) can make in a time window, which slows brute-force password guessing, account-creation spam and simple denial-of-service.

| Limiter | Applies to | Default |
| --- | --- | --- |
| Signup limiter | `POST /api/v1/user/signup` | 10 requests / 15 min per IP |
| Login limiter | `POST /api/v1/user/login` | 10 requests / 15 min per IP |
| General API limiter | every `/api/*` route | 100 requests / 15 min per IP |

When a limit is exceeded the API returns **429 Too Many Requests** with standard `RateLimit` / `Retry-After` headers and:
```json
{ "status": false, "message": "Too many authentication attempts. Please try again later.", "retry_after_seconds": 900 }
```
The event is also logged as `Rate limit exceeded (login)`. **Tested:** the Postman request *09 - Rate limiting → Login - rate limit exceeded (429)* sends repeated bad logins; after the 10th the 11th returns `429`. Limits reset after the window (or on server restart).

> Note: limits are kept in memory. On Vercel each serverless instance keeps its own counter, which is fine for this assignment; a shared store (e.g. Redis) would be used in production.

## Logging

- **Where:** `logs/app.log` (all levels) and `logs/error.log` (errors only), in JSON lines, plus coloured console output. On Vercel the filesystem is read-only, so files go to `/tmp/logs` and the console output appears in **Vercel → Project → Logs**. A sample is committed at `logs/sample/app.sample.log`.
- **What is logged:** timestamp, level, server startup and DB connection, every request (method, path, status, duration, IP, user id when authenticated), signups, successful and failed logins, validation failures (field names only), authentication failures (missing/invalid/expired token), authorization failures (cross-user access attempts), rate-limit hits, employee create/update/delete, and unexpected errors (with stack trace in the log file only).
- **Excluded on purpose:** passwords, JWTs and Authorization headers, the JWT secret, database credentials/connection strings, and request bodies. A winston format also redacts any log field whose name contains `password`, `token`, `authorization`, `jwt` or `secret`. Query-string values are not logged.

## Health check

`GET /health` (no auth, not rate-limited)

```json
{
  "status": "ok",
  "service": "comp3123-assignment1-api",
  "uptime_seconds": 42,
  "timestamp": "2026-10-16T00:45:58.394Z",
  "database": { "name": "comp3123_assignment1", "state": "connected" }
}
```
Returns `200` when the API and MongoDB are up, or `503` with `"status": "degraded"` if the database can't be reached.

---

## Deploying to Vercel

1. Create a free MongoDB Atlas cluster, add a database user, and allow network access from `0.0.0.0/0` (Vercel uses dynamic IPs).
2. Push this repo to GitHub, then in Vercel choose **Add New → Project → Import** the repository (framework preset: **Other**, no build command).
3. In **Settings → Environment Variables** add `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production` (optionally `JWT_EXPIRES_IN`).
4. Deploy. `vercel.json` routes every path to `api/index.js`, which exports the Express app. Check `https://<project>.vercel.app/health`.
5. In Postman, select the **COMP3123 A1 - Vercel** environment and set `baseUrl` to your deployment URL.

## Sample test credentials (for marking)

Non-sensitive test accounts — create them with the signup request, or use the Postman collection, which creates `usera_<suffix>` / `userb_<suffix>` automatically:

| User | username | email | password |
| --- | --- | --- | --- |
| A | `usera` | `usera@example.com` | `Password123` |
| B | `userb` | `userb@example.com` | `Password123` |
