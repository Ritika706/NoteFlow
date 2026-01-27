const express = require('express');
const path = require('path');
const multer = require('multer');
const { Note } = require('../models/Note');
const { User } = require('../models/User');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}_${safeOriginal}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Public list + search/filter
router.get('/', async (req, res) => {
  const { q, subject, semester } = req.query;

  const filter = {};
  if (subject) filter.subject = String(subject);
  if (semester) filter.semester = String(semester);
  if (q) {
    const regex = new RegExp(String(q), 'i');
    filter.$or = [{ title: regex }, { subject: regex }, { semester: regex }];
  }

  const notes = await Note.find(filter)
    .sort({ createdAt: -1 })
    .select('title subject semester description mimeType originalName uploadedBy createdAt');

  return res.json({ notes });
});

// Public details
router.get('/:id', async (req, res) => {
  const note = await Note.findById(req.params.id)
    .populate('uploadedBy', 'name email')
    .lean();

  if (!note) return res.status(404).json({ message: 'Note not found' });
  return res.json({ note });
});

// Protected upload
router.post('/', authRequired, upload.single('file'), async (req, res) => {
  const { title, subject, semester, description = '' } = req.body || {};

  if (!title || !subject || !semester) {
    return res.status(400).json({ message: 'title, subject, semester are required' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'file is required' });
  }

  const note = await Note.create({
    title: String(title),
    subject: String(subject),
    semester: String(semester),
    description: String(description || ''),
    filePath: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    uploadedBy: req.user.id,
  });

  return res.status(201).json({ note });
});

// Protected download + track
router.get('/:id/download', authRequired, async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  await User.updateOne(
    { _id: req.user.id },
    { $push: { downloads: { note: note._id, downloadedAt: new Date() } } }
  );

  const absolutePath = path.join(uploadsDir, note.filePath);
  return res.download(absolutePath, note.originalName);
});

module.exports = { notesRouter: router };
