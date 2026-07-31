const { MongoClient } = require('mongodb');

let client;
let database;

async function connectToDatabase() {
  if (database) {
    return database;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'defunct_fast_food';

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy .env.example to .env and add your connection string.');
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(dbName);

  await database.collection('restaurants').createIndex({ name: 1 }, { unique: true });
  await database.collection('restaurants').createIndex({ closedYear: 1 });
  await database.collection('restaurants').createIndex({ country: 1 });

  console.log(`Connected to MongoDB database: ${dbName}`);
  return database;
}

function getDatabase() {
  if (!database) {
    throw new Error('Database connection has not been initialized.');
  }
  return database;
}

async function closeDatabase() {
  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
}

module.exports = {
  connectToDatabase,
  getDatabase,
  closeDatabase
};
