import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

//Routes
import scriptsRouter from './routes/scripts.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
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

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});