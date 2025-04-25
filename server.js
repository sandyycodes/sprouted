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

// === New check endpoint ===
app.post('/check-plant', async (req, res) => {
    console.log("Incoming check-plant request:", req.body);
    const { device_id, plantType } = req.body;

    if (!device_id || !plantType) {
        return res.status(400).json({ message: "Missing device_id or plantType" });
    }

    try {
        const exists = await Leaderboard.findOne({ device_id, plantType });
        if (exists) {
            return res.status(200).json({ exists: true });
        } else {
            return res.status(200).json({ exists: false });
        }
    } catch (err) {
        console.error("Error checking plant existence:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// === Existing update endpoint ===
app.post('/update', async (req, res) => {
    const { device_id, plantName, plantType, birthday, temperature, humidity, moisture } = req.body;
    const safeBirthday = birthday ? new Date(birthday) : null;

    if (!device_id) {
        return res.status(400).json({ message: "Missing Device Id" });

    }

    const score =
        temperature && humidity && moisture
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
        const result = await Leaderboard.updateOne(
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

// === Leaderboard Data Endpoint ===
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
