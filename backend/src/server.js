const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { connectDb } = require('./db');
const { authRouter } = require('./routes/auth');
const { notesRouter } = require('./routes/notes');
const { meRouter } = require('./routes/me');

const app = express();

app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);

// Public preview support
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/notes', notesRouter);
app.use('/api/me', meRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in environment');
  }

  await connectDb();
  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => console.log(`✅ API listening on ${port}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
