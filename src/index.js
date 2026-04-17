import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

//Routes
import scriptsRouter from './routes/scripts.js';
import authRouter from './routes/auth.js';
import characterRouter from './routes/characters.js';
import gamesRouter from './routes/games.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/scripts', scriptsRouter);
app.use('/api/auth', authRouter);
app.use('/api/characters', characterRouter);
app.use('/api/games', gamesRouter);

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});