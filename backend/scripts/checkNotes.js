require('dotenv').config();
const mongoose = require('mongoose');
const { Note } = require('../src/models/Note');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const broken = await Note.find({
    $or: [{ fileUrl: { $exists: false } }, { fileUrl: '' }]
  }).select('_id title filePath').lean();
  
  console.log('\n❌ BROKEN NOTES (no Cloudinary URL):', broken.length);
  broken.forEach(n => console.log('  -', n.title, '|', n.filePath));
  
  const good = await Note.countDocuments({ fileUrl: { $ne: '' } });
  console.log('\n✅ GOOD NOTES (has Cloudinary URL):', good);
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
