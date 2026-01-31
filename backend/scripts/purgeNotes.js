/*
  DANGEROUS: This script deletes notes from MongoDB.

  Usage:
    node scripts/purgeNotes.js --yes
    node scripts/purgeNotes.js --yes --only-missing-fileUrl

  Optional (very destructive): delete Cloudinary assets by folder prefix.
    CONFIRM_CLOUDINARY_PURGE=true node scripts/purgeNotes.js --yes --cloudinary
*/

const dotenv = require('dotenv');
dotenv.config();

const cloudinary = require('cloudinary').v2;
const { connectDb } = require('../src/db');
const { Note } = require('../src/models/Note');
const { User } = require('../src/models/User');

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function requireYes() {
  if (!hasFlag('--yes')) {
    console.error('Refusing to run. Pass --yes to confirm destructive action.');
    process.exit(2);
  }
}

function initCloudinaryOrThrow() {
  const ok = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
  if (!ok) {
    throw new Error('Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function purgeCloudinaryByFolderPrefix() {
  const confirm = String(process.env.CONFIRM_CLOUDINARY_PURGE || 'false').toLowerCase() === 'true';
  if (!confirm) {
    console.log('Skipping Cloudinary purge (set CONFIRM_CLOUDINARY_PURGE=true to enable).');
    return;
  }

  initCloudinaryOrThrow();

  const folder = String(process.env.CLOUDINARY_FOLDER || 'noteflow').replace(/^\/+|\/+$/g, '');
  const prefix = folder ? `${folder}/` : '';

  // Cloudinary stores different resource types (image, raw, video). Notes can be raw (pdf/doc).
  // We try to delete by prefix for each type. This can still miss assets if folder differs.
  const resourceTypes = ['raw', 'image', 'video'];

  console.log(`Deleting Cloudinary resources by prefix: ${prefix || '(empty prefix)'} ...`);
  for (const resource_type of resourceTypes) {
    try {
      const res = await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type });
      console.log(`Cloudinary delete by prefix (${resource_type}):`, res?.deleted_counts || res?.deleted || 'ok');
    } catch (e) {
      console.warn(`Cloudinary delete by prefix (${resource_type}) failed:`, e?.message || e);
    }
  }
}

async function main() {
  requireYes();

  await connectDb();

  const onlyMissingFileUrl = hasFlag('--only-missing-fileUrl');
  const deleteFromCloudinary = hasFlag('--cloudinary');

  const filter = onlyMissingFileUrl ? { $or: [{ fileUrl: '' }, { fileUrl: { $exists: false } }] } : {};

  const notesToDelete = await Note.find(filter).select('_id').lean();
  const noteIds = notesToDelete.map((n) => n._id);

  console.log(`Notes matched: ${noteIds.length}`);
  if (noteIds.length === 0) {
    console.log('Nothing to delete.');
    process.exit(0);
  }

  // Clear user references (downloads + bookmarks)
  const userUpdate = await User.updateMany(
    {},
    {
      $pull: {
        downloads: { note: { $in: noteIds } },
        bookmarks: { $in: noteIds },
      },
    }
  );
  console.log('User refs cleaned:', userUpdate?.modifiedCount ?? userUpdate);

  const deleteRes = await Note.deleteMany({ _id: { $in: noteIds } });
  console.log('Notes deleted:', deleteRes?.deletedCount ?? deleteRes);

  if (deleteFromCloudinary) {
    await purgeCloudinaryByFolderPrefix();
  } else {
    console.log('Cloudinary purge skipped (pass --cloudinary to enable).');
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('purgeNotes failed:', err?.message || err);
  process.exit(1);
});
