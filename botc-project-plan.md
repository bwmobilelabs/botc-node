# Blood on the Clocktower — Project Plan

## 1. High-Level Architecture

```
┌──────────────┐        ┌──────────────────────┐        ┌────────────┐
│  React SPA   │◄──────►│   Node.js / Express  │◄──────►│ PostgreSQL │
│  (front end) │  REST  │       API Server     │  SQL   │            │
│              │  +WS   │                      │        │            │
└──────────────┘        └──────────┬───────────┘        └────────────┘
                                   │
                            ┌──────┴──────┐
                            │  Socket.io  │
                            │  (real-time │
                            │  game state)│
                            └─────────────┘
```

The front end communicates with the server over two channels:

- **REST API** for CRUD operations (auth, characters, scripts, game creation/joining).
- **WebSocket (Socket.io)** for real-time game state updates (player circle changes, death markers, ghost votes, reminder tokens). Every player in a game joins a Socket.io room keyed to the game's invite code, and the server broadcasts state diffs.

---

## 2. Tech Stack & Dependencies

### Runtime & Framework

| Package | Purpose |
|---|---|
| `node` (v20 LTS+) | Server runtime |
| `express` | HTTP framework |
| `socket.io` | Real-time bidirectional communication |
| `cors` | Cross-origin requests (dev + hosted frontend) |
| `dotenv` | Environment variable management |
| `helmet` | Security headers |
| `express-rate-limit` | Rate limiting on auth endpoints |

### Database

| Package | Purpose |
|---|---|
| PostgreSQL 15+ | Primary data store |
| `pg` (node-postgres) | PostgreSQL driver |
| `knex` **or** `prisma` | Query builder / ORM (pick one — see notes below) |

**Knex vs Prisma:** Knex is lightweight and gives you raw SQL control, which is great for demonstrating backend skill. Prisma is more opinionated but handles migrations and type safety nicely. For a portfolio project where you want to show you understand SQL, **Knex is the stronger choice**. Use Prisma if you'd rather move fast.

### Authentication

| Package | Purpose |
|---|---|
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT creation & verification |
| `cookie-parser` | If using HTTP-only cookie transport for JWTs |

**Auth strategy:** Stateless JWT-based auth. On sign-up/sign-in the server returns an access token (short-lived, ~15 min) and a refresh token (longer-lived, stored in an HTTP-only cookie). The access token is sent via `Authorization: Bearer <token>` header. Socket.io connections authenticate via the token passed during the handshake.

### Validation & Error Handling

| Package | Purpose |
|---|---|
| `zod` **or** `joi` | Request body / param validation |
| `http-errors` | Consistent error responses |

### Dev Tooling

| Package | Purpose |
|---|---|
| `nodemon` | Auto-restart during development |
| `eslint` + `prettier` | Linting / formatting |
| `jest` **or** `vitest` | Testing |
| `supertest` | HTTP integration tests |

### Optional but Recommended

| Package | Purpose |
|---|---|
| `redis` / `ioredis` | Session store, Socket.io adapter for horizontal scaling, caching |
| `winston` **or** `pino` | Structured logging |
| `swagger-jsdoc` + `swagger-ui-express` | Auto-generated API docs (great for a portfolio) |
| `multer` | If you ever add avatar/image uploads |

---

## 3. Database Schema

Below is every table, its columns, and the relationships between them. All tables include `created_at` and `updated_at` timestamps.

### 3.1 `users`

Stores registered accounts.

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(30)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(50),
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
```

### 3.2 `refresh_tokens`

Tracks active refresh tokens so they can be revoked.

```sql
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

### 3.3 `characters`

Seeded with every official BotC character. This table is read-only for users.

```sql
CREATE TYPE character_type AS ENUM (
    'townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled'
);

CREATE TABLE characters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    type        character_type NOT NULL,
    edition     VARCHAR(50),              -- e.g. 'Trouble Brewing', 'Sects & Violets', etc.
    ability     TEXT         NOT NULL,
    flavor_text TEXT,
    icon_url    TEXT,
    setup       BOOLEAN      NOT NULL DEFAULT false,  -- affects setup (like Drunk, Baron)
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_characters_type ON characters(type);
CREATE INDEX idx_characters_edition ON characters(edition);
CREATE INDEX idx_characters_name_trgm ON characters USING gin (name gin_trgm_ops);
```

> **Note:** The trigram index (`pg_trgm` extension) powers fuzzy/partial character search. Enable it with `CREATE EXTENSION IF NOT EXISTS pg_trgm;`

### 3.4 `reminder_token_definitions`

Each character can have associated reminder tokens (e.g. "Drunk", "Poisoned", "Dead", "Is the Demon").

```sql
CREATE TABLE reminder_token_definitions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    text         VARCHAR(100) NOT NULL,
    type         VARCHAR(30)  DEFAULT 'character'  -- 'character', 'global', 'custom'
);

CREATE INDEX idx_reminder_defs_char ON reminder_token_definitions(character_id);
```

### 3.5 `scripts`

User-created scripts (curated sets of characters).

```sql
CREATE TABLE scripts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_official BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_scripts_owner ON scripts(owner_id);
```

### 3.6 `script_characters` (join table)

Links characters to scripts.

```sql
CREATE TABLE script_characters (
    script_id    UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    PRIMARY KEY (script_id, character_id)
);
```

### 3.7 `games`

A single game session.

```sql
CREATE TYPE game_status AS ENUM ('lobby', 'in_progress', 'completed');

CREATE TABLE games (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyteller_id  UUID         NOT NULL REFERENCES users(id),
    active_script_id UUID        REFERENCES scripts(id),
    invite_code     VARCHAR(8)   NOT NULL UNIQUE,
    status          game_status  NOT NULL DEFAULT 'lobby',
    name            VARCHAR(100),
    phase           VARCHAR(20)  DEFAULT 'day',       -- 'day' or 'night'
    day_number      INT          DEFAULT 1,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_games_invite ON games(invite_code);
```

### 3.8 `game_players`

Players in a game, their seat order, assigned character, and alive/dead status.

```sql
CREATE TABLE game_players (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id       UUID    NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id       UUID    NOT NULL REFERENCES users(id),
    character_id  UUID    REFERENCES characters(id),
    seat_order    INT,
    is_alive      BOOLEAN NOT NULL DEFAULT true,
    has_ghost_vote BOOLEAN NOT NULL DEFAULT true,  -- starts true, set to false after using it
    vote_used     BOOLEAN NOT NULL DEFAULT false,
    notes         TEXT,                             -- storyteller's private notes on this player
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(game_id, user_id),
    UNIQUE(game_id, seat_order)
);

CREATE INDEX idx_game_players_game ON game_players(game_id);
```

### 3.9 `game_reminder_tokens`

Reminder tokens placed by the storyteller during a game, attached to a specific player.

```sql
CREATE TABLE game_reminder_tokens (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id           UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    target_player_id  UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
    reminder_def_id   UUID REFERENCES reminder_token_definitions(id),
    custom_text       VARCHAR(100),  -- for ad-hoc reminders not tied to a definition
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_reminders_game ON game_reminder_tokens(game_id);
CREATE INDEX idx_game_reminders_player ON game_reminder_tokens(target_player_id);
```

### 3.10 `game_log`

Optional audit log for game events (useful for replays, debugging, and showing off backend chops).

```sql
CREATE TABLE game_log (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id    UUID        NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    actor_id   UUID        REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,  -- e.g. 'player_died', 'phase_change', 'character_assigned'
    payload    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_log_game ON game_log(game_id);
CREATE INDEX idx_game_log_event ON game_log(event_type);
```

### Entity Relationship Diagram

```
users ──────┬──< refresh_tokens
            │
            ├──< scripts ──< script_characters >── characters
            │                                        │
            ├──< games                               │
            │      │                                  ├──< reminder_token_definitions
            │      ├──< game_players >────────────────┘
            │      │       │
            │      │       └──< game_reminder_tokens >── reminder_token_definitions
            │      │
            │      └──< game_log
            │
            └──(storyteller_id on games)
```

---

## 4. API Endpoints

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account (username, email, password) |
| POST | `/api/auth/login` | Returns access + refresh tokens |
| POST | `/api/auth/refresh` | Exchange refresh token for new access token |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET  | `/api/auth/me` | Get current user profile |

### Characters

| Method | Route | Description |
|---|---|---|
| GET | `/api/characters` | List all characters (supports `?search=`, `?type=`, `?edition=`) |
| GET | `/api/characters/:id` | Single character detail with reminder token definitions |

### Scripts

| Method | Route | Description |
|---|---|---|
| GET    | `/api/scripts` | List current user's scripts |
| POST   | `/api/scripts` | Create a new script |
| GET    | `/api/scripts/:id` | Get script with its characters |
| PUT    | `/api/scripts/:id` | Update script name/description/characters |
| DELETE | `/api/scripts/:id` | Delete a script |

### Games

| Method | Route | Description |
|---|---|---|
| POST   | `/api/games` | Create a game (returns invite code) |
| POST   | `/api/games/join` | Join a game by invite code |
| GET    | `/api/games/:id` | Get game state (filtered by role — storyteller sees all, player sees limited) |
| PATCH  | `/api/games/:id` | Update game settings (storyteller only — set active script, name) |
| DELETE | `/api/games/:id` | Delete/end a game |
| GET    | `/api/games/:id/players` | List players in the game |

### Storyteller Actions (REST or Socket — your call)

| Method | Route | Description |
|---|---|---|
| PATCH | `/api/games/:id/players/:playerId` | Assign/change character, kill/revive, toggle ghost vote |
| POST  | `/api/games/:id/reminders` | Place a reminder token |
| DELETE| `/api/games/:id/reminders/:reminderId` | Remove a reminder token |
| PATCH | `/api/games/:id/phase` | Advance phase (day/night) and day number |

---

## 5. Socket.io Events

Every player and storyteller in a game joins room `game:<invite_code>`.

### Client → Server

| Event | Payload | Who | Description |
|---|---|---|---|
| `game:join` | `{ inviteCode }` | Any | Join the socket room for a game |
| `game:leave` | `{ gameId }` | Any | Leave the socket room |
| `st:assign_character` | `{ playerId, characterId }` | Storyteller | Assign a character |
| `st:toggle_alive` | `{ playerId }` | Storyteller | Kill or revive |
| `st:toggle_ghost_vote` | `{ playerId }` | Storyteller | Mark ghost vote as used |
| `st:place_reminder` | `{ playerId, reminderDefId?, customText? }` | Storyteller | Place reminder token |
| `st:remove_reminder` | `{ reminderId }` | Storyteller | Remove reminder token |
| `st:advance_phase` | `{ }` | Storyteller | Move to next phase |
| `st:set_script` | `{ scriptId }` | Storyteller | Set active script |
| `st:update_seat_order` | `{ playerOrder: [] }` | Storyteller | Reorder seats |

### Server → Client (broadcast to room)

| Event | Payload | Description |
|---|---|---|
| `game:state_update` | Full or partial game state | Broadcast after any mutation |
| `game:player_joined` | `{ player }` | New player entered the game |
| `game:player_left` | `{ playerId }` | Player left |
| `game:phase_changed` | `{ phase, dayNumber }` | Phase advanced |
| `game:ended` | `{ }` | Game completed |

**Important:** The server must filter what it sends. Players should never receive other players' character assignments, reminder tokens, or storyteller notes. Only the storyteller gets the full state. Each player gets their own character plus the public state (seat order, alive/dead, ghost vote status).

---

## 6. Project Folder Structure

```
botc-server/
├── src/
│   ├── index.js                  # Entry point — starts Express + Socket.io
│   ├── config/
│   │   ├── db.js                 # pg pool / Knex / Prisma client
│   │   ├── env.js                # Validated env vars
│   │   └── socket.js             # Socket.io server setup
│   ├── middleware/
│   │   ├── auth.js               # JWT verification middleware
│   │   ├── errorHandler.js       # Global error handler
│   │   ├── validate.js           # Zod/Joi validation middleware
│   │   └── isStoryteller.js      # Authorization: must be game's storyteller
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── character.routes.js
│   │   ├── script.routes.js
│   │   └── game.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── character.controller.js
│   │   ├── script.controller.js
│   │   └── game.controller.js
│   ├── services/                 # Business logic layer
│   │   ├── auth.service.js
│   │   ├── character.service.js
│   │   ├── script.service.js
│   │   └── game.service.js
│   ├── socket/
│   │   ├── index.js              # Register socket event handlers
│   │   ├── gameHandlers.js       # All game-related socket events
│   │   └── authMiddleware.js     # Socket handshake JWT verification
│   ├── db/
│   │   ├── migrations/           # Knex or Prisma migrations
│   │   └── seeds/
│   │       └── characters.js     # Seed all BotC characters
│   └── utils/
│       ├── inviteCode.js         # Generate unique invite codes
│       └── gameState.js          # Build filtered game state per role
├── tests/
│   ├── auth.test.js
│   ├── characters.test.js
│   ├── scripts.test.js
│   └── games.test.js
├── .env.example
├── .eslintrc.js
├── knexfile.js                   # (or prisma/schema.prisma)
├── package.json
└── README.md
```

---

## 7. Auth Flow in Detail

```
Register:
  1. Validate input (zod)
  2. Check username/email uniqueness
  3. Hash password with bcrypt (12 rounds)
  4. Insert into users table
  5. Generate access token (JWT, 15 min) + refresh token (JWT, 7 days)
  6. Store refresh token hash in refresh_tokens table
  7. Return access token in body, refresh token in HTTP-only cookie

Login:
  1. Find user by email or username
  2. Compare password with bcrypt
  3. Same token flow as register

Refresh:
  1. Read refresh token from cookie
  2. Verify JWT signature + expiry
  3. Look up hash in refresh_tokens table
  4. If valid: issue new access token, rotate refresh token
  5. If invalid: clear cookie, return 401

Socket Auth:
  1. Client sends access token in socket handshake auth
  2. Socket middleware verifies JWT
  3. Attaches user to socket instance
  4. Rejects connection if token is invalid
```

---

## 8. Key Design Decisions & Considerations

### Game state: Database vs. in-memory

Keep the source of truth in PostgreSQL. Every mutation goes through the DB first, then the updated state is broadcast via Socket.io. This means if the server restarts, games can resume. For performance, you can cache the active game state in memory (or Redis) and write-through to the DB.

### Invite codes

Generate 6–8 character alphanumeric codes (exclude ambiguous characters like 0/O, 1/l). Check for collisions on insert. With 8 chars from a 32-char alphabet you get ~1 trillion combinations — more than enough.

### Role-based state filtering

This is the most important piece of backend logic. Build a `buildGameStateForUser(gameId, userId)` function that returns:

- **For storyteller:** Everything — all characters, all reminder tokens, all notes, full player list.
- **For player:** Their own character, the player list (names, seat order, alive/dead, ghost vote status), the active script's character list, the current phase/day. No other players' characters, no reminder tokens, no storyteller notes.

### Seeding characters

Scrape or manually compile all official BotC characters into a seed file. Each character needs: name, type, edition, ability text, and any associated reminder tokens. The three base editions to include are Trouble Brewing, Sects & Violets, and Bad Moon Rising, plus any experimental characters you want.

### Nominations & voting

This plan doesn't include a full nomination/voting system (which is quite complex in BotC). For v1, the storyteller can manage this verbally or through a separate voice channel, and just use the app to track game state. You could add a voting system as a v2 feature.

---

## 9. Deployment & Hosting Recommendations

| Concern | Recommendation |
|---|---|
| **Server hosting** | Railway, Render, or Fly.io (all have free/cheap tiers, easy Node deploys) |
| **PostgreSQL** | Supabase (free tier), Neon, or Railway's managed Postgres |
| **Frontend hosting** | Vercel or Netlify (free for public repos) |
| **Domain** | Optional — services above give you a subdomain for free |
| **CI/CD** | GitHub Actions — lint, test, deploy on push to main |
| **Environment** | Use `.env` locally, platform env vars in production |

---

## 10. Suggested Build Order

This is the order I'd recommend building things in, each phase building on the last:

**Phase 1 — Foundation**
Set up the project, configure Express, connect to PostgreSQL, run the first migration. Get a health-check endpoint returning JSON.

**Phase 2 — Auth**
Implement register, login, refresh, logout. Add the JWT middleware. Write tests for all auth flows. This is the backbone everything else depends on.

**Phase 3 — Characters**
Run the character seed migration. Build the GET endpoints with search/filter. This is a quick win that gives you data to work with.

**Phase 4 — Scripts**
CRUD for scripts and the script_characters join table. Storytellers can build and manage their custom scripts.

**Phase 5 — Game Lobby**
Create game, generate invite code, join game. Build the game_players table logic. No real-time yet — just REST endpoints.

**Phase 6 — Socket.io Integration**
Wire up Socket.io, implement room joining, add the socket auth middleware. Start broadcasting game state updates when the storyteller makes changes via REST.

**Phase 7 — Storyteller Controls**
Character assignment, kill/revive, ghost vote toggle, reminder token placement, phase advancement. This is where the Socket.io events from section 5 come in. Build the state filtering function.

**Phase 8 — Polish**
Game log/audit trail, error handling edge cases, rate limiting, Swagger docs, comprehensive tests, deploy.
