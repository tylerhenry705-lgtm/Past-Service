require('dotenv').config();

const path = require('path');
const express = require('express');
const { connectToDatabase, closeDatabase } = require('./config/db');
const restaurantRoutes = require('./routes/restaurants');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', application: 'Defunct Fast-Food Archive' });
});

app.use('/api/restaurants', restaurantRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.code === 11000) {
    return res.status(409).json({ error: 'A restaurant with that name already exists.' });
  }

  if (error.message?.includes('required') ||
      error.message?.includes('must be') ||
      error.message?.includes('cannot be') ||
      error.message?.includes('cannot be earlier')) {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

async function start() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to start the application:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\nReceived ${signal}. Closing MongoDB connection...`);
  await closeDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
