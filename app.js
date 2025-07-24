const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); // Required to use .env variables on Render

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === Connect to MongoDB Atlas using environment variable ===
mongoose.connect(process.env.MONGO_URI)

.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// === Define Schema ===
const electionSchema = new mongoose.Schema({
  state: String,
  totalSeats: Number,
  party1: String,
  party1Seats: Number,
  party2: String,
  party2Seats: Number,
});

const Election = mongoose.model('Election', electionSchema, 'electionnewdatas');

// === API Route to fetch all election data ===
app.get('/election-data', async (req, res) => {
  try {
    const data = await Election.find({});
    res.json(data);
  } catch (err) {
    console.error('Error fetching election data:', err);
    res.status(500).send('Server error');
  }
});

// === Route to serve GeoJSON ===
app.get('/data/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'data', req.params.filename);
  res.sendFile(filePath);
});

// === Start Server ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});