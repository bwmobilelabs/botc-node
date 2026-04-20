# Blood on the Clocktower — API (portfolio)

This repository is a **portfolio backend** built to demonstrate practical skills in **Node.js**, **Express**, and **PostgreSQL**. It powers a web-style API for hosting and managing *Blood on the Clocktower*–style games: accounts, character data, custom scripts, and game sessions with storyteller-oriented controls.

---

## How this project was built

I started with a **detailed written prompt** describing the product I wanted (architecture, data model, API shape, and real-time ideas). I used an **AI agent** to turn that into a structured project plan I could follow, and change during implementation where it made sense: [botc-project-plan.md](./botc-project-plan.md). **I implemented the backend myself.**

For the server code specifically, I **did not use an AI agent to write implementation for me**. Instead I:

- **Learned from videos and docs** on topics such as Express patterns, Knex migrations, PostgreSQL design, and JWT-based auth.
- Used **Cursor in Ask mode** the way I would use a senior engineer: to **compare approaches**, **sanity-check decisions**, and **review code I had already written**—not to author the codebase.

While building this out, I used **Postman** against a locally running server to hit each route, carry cookies and bearer tokens correctly, and confirm responses matched what I intended. I used **TablePlus** with a **local PostgreSQL** instance to **seed and inspect data**, run **ad hoc queries**, and double-check that rows and constraints looked right after migrations, seeds, and API calls—so I could trust both the database and the HTTP layer before moving on.

The result is code I can explain line by line and defend in an interview.

---

## Tech stack

- **Runtime:** Node.js (ES modules)
- **HTTP:** Express 5
- **Database:** PostgreSQL, accessed with **Knex** (migrations, query builder)
- **Auth:** `jsonwebtoken`, `bcrypt`, `cookie-parser`
- **Other:** `helmet`, `cors`, `dotenv`, `nanoid` (invite codes)

---

## Authentication (JWT) and why it is “industry shaped”

The API uses a **stateless access token** plus a **server-stored refresh session**, which is a common pattern for SPAs and mobile clients:

- **Access token (JWT)** — Short-lived. Returned in the JSON body on register/login/refresh. Sent by clients on protected routes via the `Authorization: Bearer <token>` header (verified in middleware).
- **Refresh token (JWT)** — Longer-lived. Issued on register/login/refresh and sent to the browser as an **HTTP-only cookie** (not readable from JavaScript, which mitigates XSS token theft). Cookie options include `sameSite`, `secure` in production, and a narrow `path` scoped to auth routes.
- **Refresh token storage** — Only a **SHA-256 hash** of the refresh JWT is stored in PostgreSQL (`refresh_tokens`), not the raw token. That way a database leak does not immediately expose usable refresh tokens.
- **Rotation** — On successful refresh, a **new** refresh token is issued and the **old** row is removed, which supports revocation and reduces replay window.
- **Passwords** — Hashed with **bcrypt** (12 rounds) before persistence.

Together this mirrors patterns you see in production APIs: short-lived access credentials, refresh handled via cookie + server-side tracking, and hashed secrets at rest.

---

## Database schema

Table layouts, enums, indexes, and relationships are documented in [schema.md](./schema.md) at the root of this repository. That file reflects what the **Knex migrations** define (users, characters, scripts, games, players, reminder definitions, etc.).

The **`script_characters`** join table stores a **`sort_order`** per row because a script is an **ordered list**: when someone creates or edits a script, the character names arrive in a sequence that matters for readability and for in-game tooling (for example, reminder definitions tied to the active script are ordered consistently). Relational joins alone do not guarantee that order, so the migration enforces it in the database and the API **returns characters in the same order they were saved**—typically by selecting with `ORDER BY sort_order`.

---

## API overview

Base URL in development is typically `http://localhost:3000` (or the port set by `PORT`). JSON request bodies are expected where noted.

### Auth — `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/register` | Create an account; returns user summary and access token; sets refresh cookie. |
| `POST` | `/login` | Authenticate; same token/cookie behavior as register. |
| `POST` | `/refresh` | Use refresh cookie to obtain a new access token (and rotated refresh). |
| `POST` | `/logout` | Revoke the current refresh session and clear the cookie. |
| `GET` | `/me` | **Requires auth.** Returns profile fields for the current user. |

Protected routes expect: `Authorization: Bearer <access_token>`.

### Characters — `/api/characters`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List catalog characters (typed ordering for display). |
| `GET` | `/:id` | Single character including flavor text. |

### Scripts — `/api/scripts`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Public listing of scripts (limited batch for browsing). |
| `GET` | `/my_scripts` | **Requires auth.** Scripts owned by the current user. |
| `POST` | `/` | **Requires auth.** Create a script from an ordered list of character names; seeds `script_characters` with sort order. |
| `GET` | `/:id` | Script metadata plus ordered characters (join query). |
| `PUT` | `/:id` | **Requires auth.** Update script if you own it; replaces linked characters. |
| `DELETE` | `/:id` | **Requires auth.** Delete script if you own it. |

### Games — `/api/games`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | **Requires auth.** Create a game; returns `game_id` and `invite_code`. |
| `POST` | `/join` | **Requires auth.** Join by `invite_code` in the body. |
| `POST` | `/:id/leave` | **Requires auth.** Remove yourself from the game roster. |
| `PATCH` | `/:id` | **Requires auth.** Storyteller-only update of game fields (e.g. name, script, phase, status). |
| `PATCH` | `/:gameID/player/:playerID` | **Requires auth.** Storyteller-only update of a roster row (character, seat, life, ghost vote, notes, etc.). The `:playerID` segment is the **player user’s id** (not the internal `game_players` row id). |
| `GET` | `/:id` | **Requires auth.** Game summary and players; response is **richer for the storyteller** (including reminders and private fields) and **reduced for other players**. |
| `DELETE` | `/:id` | **Requires auth.** Storyteller-only delete/end game. |
| `GET` | `/:id/reminders` | **Requires auth.** Storyteller-only: reminder definitions available from the game’s active script. |
| `POST` | `/:id/reminders` | **Requires auth.** Place a reminder token on a player (`reminder_token_id`, `player_id`, optional `text`). |
| `DELETE` | `/:game_id/reminders` | **Requires auth.** Remove a placed token; identifier passed in the body. |

---

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables** — Create a `.env` file. You need PostgreSQL connection settings (see `knexfile.mjs`: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) plus JWT secrets and expiry settings used in `src/utils/jwt.js` (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`). Optional: `PORT`, `CORS_ORIGIN`, `NODE_ENV`.

3. **Migrations and seeds**

   ```bash
   npm run migrate:latest
   npm run seed
   ```

4. **Run the server**

   ```bash
   npm run dev
   ```

---

## License

ISC (see `package.json`).
