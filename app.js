const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); // Loads .env variables

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Define Schema and Model
const electionSchema = new mongoose.Schema({
  state: String,
  totalSeats: Number,
  party1: String,
  party1Seats: Number,
  party2: String,
  party2Seats: Number,
});
const Election = mongoose.model('Election', electionSchema, 'electionnewdatas');

// ✅ API route to fetch all election data
app.get('/election-data', async (req, res) => {
  try {
    const data = await Election.find({});
    console.log("📦 Fetched from DB:", data.length);
    res.json(data);
  } catch (err) {
    console.error('Error fetching election data:', err);
    res.status(500).send('Server error');
  }
});

// ✅ Serve static GeoJSON file
app.get('/data/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'data', req.params.filename);
  res.sendFile(filePath);
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
