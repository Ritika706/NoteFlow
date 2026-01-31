const mongoose = require('mongoose');

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing in environment');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  const conn = mongoose.connection;
  console.log('✅ MongoDB connected');
  console.log(`   host=${conn.host} db=${conn.name}`);
}

module.exports = { connectDb };
