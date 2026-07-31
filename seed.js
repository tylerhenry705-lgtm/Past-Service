require('dotenv').config();

const restaurants = require('./data/restaurants.json');
const { connectToDatabase, closeDatabase } = require('./config/db');

async function seed() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('restaurants');

    await collection.deleteMany({});

    const now = new Date();
    const documents = restaurants.map((restaurant) => ({
      ...restaurant,
      createdAt: now,
      updatedAt: now
    }));

    const result = await collection.insertMany(documents);
    console.log(`Inserted ${result.insertedCount} restaurants.`);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

seed();
