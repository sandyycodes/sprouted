require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(`Connected to MongoDB Atlas`))
  .catch(err => console.error('MongoDB connection error:', err));

const leaderboardSchema = new mongoose.Schema({
  device_id: { type: String, required: true, unique: true },
  plantName: { type: String },
  plantType: { type: String },
  birthday: { type: Date },
  temperature: { type: Number },
  humidity: { type: Number },
  moisture: { type: Number },
  score: { type: Number },
  lastUpdated: { type: Date, default: Date.now }
}, { collection: 'leaderboard' });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// === Updated check endpoint (only checks device_id) ===
app.post('/check-plant', async (req, res) => {
    const { device_id } = req.body;

    if (!device_id) {
        return res.status(400).json({ message: "Missing device_id" });
    }

    try {
        const exists = await Leaderboard.findOne({ device_id: device_id.toLowerCase() });
        if (exists) {
            return res.status(200).json({ exists: true, data: exists });
        } else {
            return res.status(404).json({ exists: false, message: "No matching device found" });
        }
    } catch (err) {
        console.error("Error checking plant existence:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// === New: Endpoint to fetch plant sensor data by ID ===
app.post('/fetch-plant-data', async (req, res) => {
  const { device_id } = req.body;

  if (!device_id) {
    return res.status(400).json({ message: "Missing device_id" });
  }

  try {
    const plant = await Leaderboard.findOne({ device_id });

    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

    res.status(200).json({
      moisture: plant.moisture,
      humidity: plant.humidity,
      temperature: plant.temperature
    });
  } catch (err) {
    console.error("Error fetching plant data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === Existing: Endpoint to handle registration/update ===
app.post('/update', async (req, res) => {
  const { device_id, plantName, plantType, birthday, temperature, humidity, moisture } = req.body;
  const safeBirthday = birthday ? new Date(birthday) : null;

  if (!device_id) {
    return res.status(400).json({ message: "Missing device ID" });
  }

  const score =
    (typeof temperature === 'number' && typeof humidity === 'number' && typeof moisture === 'number')
      ? (100 - Math.abs(temperature - 25)) + (humidity / 2) + (moisture / 10)
      : null;

  const updateFields = {
    device_id,
    plantName,
    plantType,
    birthday: safeBirthday,
    temperature,
    humidity,
    moisture,
    score,
    lastUpdated: new Date()
  };

  try {
    await Leaderboard.updateOne(
      { device_id },
      { $set: updateFields },
      { upsert: true }
    );
    res.status(200).json({ message: "Data received & score updated", score });
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    res.status(500).json({ message: "Database update error" });
  }
});

// === Leaderboard fetch endpoint ===
app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find().sort({ score: -1 });
    res.status(200).json(leaderboard);
  } catch (err) {
    console.error("Error fetching leaderboard data:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard data." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
