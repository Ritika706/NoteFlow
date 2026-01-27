const express = require('express');
const { authRequired } = require('../middleware/auth');
const { User } = require('../models/User');
const { Note } = require('../models/Note');

const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).select('name email').lean();
  if (!user) return res.status(404).json({ message: 'User not found' });

  const uploads = await Note.find({ uploadedBy: req.user.id })
    .sort({ createdAt: -1 })
    .select('title subject semester description mimeType originalName createdAt')
    .lean();

  const populated = await User.findById(req.user.id)
    .populate({ path: 'downloads.note', select: 'title subject semester mimeType originalName' })
    .select('downloads')
    .lean();

  return res.json({
    user: { id: req.user.id, name: user.name, email: user.email },
    uploads,
    downloads: populated?.downloads || [],
  });
});

module.exports = { meRouter: router };
