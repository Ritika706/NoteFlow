const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema(
  {
    note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
    downloadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    downloads: { type: [downloadSchema], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = { User };
