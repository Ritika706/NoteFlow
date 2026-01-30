const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { connectDb } = require('./db');
const { authRouter } = require('./routes/auth');
const { notesRouter } = require('./routes/notes');
const { meRouter } = require('./routes/me');
const { Note } = require('./models/Note');
const { User } = require('./models/User');

const app = express();

app.use(express.json());

const corsOriginRaw = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsAllowList = corsOriginRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isCorsOriginAllowed(origin) {
  // Allow non-browser requests (no Origin header)
  if (!origin) return true;

  return corsAllowList.some((allowed) => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      // e.g. '*.vercel.app' matches 'https://foo.vercel.app'
      return origin.endsWith(allowed.slice(1));
    }
    return origin === allowed;
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, isCorsOriginAllowed(origin));
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Public preview support
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/api/stats', async (req, res) => {
  const [totalNotes, contributorsAgg, downloadsAgg] = await Promise.all([
    Note.countDocuments(),
    User.countDocuments(),
    Note.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]),
  ]);

  const totalDownloads = Number(downloadsAgg?.[0]?.total || 0);
  return res.json({ totalNotes, contributors: contributorsAgg, totalDownloads });
});
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
