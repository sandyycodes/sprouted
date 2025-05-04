console.log("starting");
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

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

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

// Check if device_id exists
app.post('/check-plant', async (req, res) => {
  const { device_id } = req.body;

  if (!device_id) {
    return res.status(400).json({ message: "Missing device_id" });
  }

  try {
    const exists = await Leaderboard.findOne({ device_id: new RegExp(`^${device_id}$`, 'i') });

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

app.post('/fetch-plant-data', async (req, res) => {
  const { plantName } = req.body;

  if (!plantName) {
    return res.status(400).json({ message: "Missing plant name" });
  }

  try {
    const plant = await Leaderboard.findOne({ plantName: new RegExp(`^${plantName}$`, 'i') });

    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

    const { plantType, temperature, humidity, moisture } = plant;

    // Define optimal ranges for each plant
    const ranges = {
      tomato:   { temp: [18, 30], humidity: [45, 75], moisture: [55, 85] },
      basil:    { temp: [18, 28], humidity: [35, 65], moisture: [45, 75] },
      spinach:  { temp: [12, 24], humidity: [35, 75], moisture: [65, 95] }
    };
    

    const range = ranges[plantType?.toLowerCase()] || {};

    function getStatus(value, [low, high]) {
      if (typeof value !== 'number') return "N/A";
      if (value < low) return "Low";
      if (value > high) return "High";
      return "Good";
    }

    res.status(200).json({
      plantName: plant.plantName || "",
      temperature,
      humidity,
      moisture,
      statuses: {
        temperature: getStatus(temperature, range.temp || [0, 100]),
        humidity: getStatus(humidity, range.humidity || [0, 100]),
        moisture: getStatus(moisture, range.moisture || [0, 100])
      }
    });
  } catch (err) {
    console.error("Error fetching plant data:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post('/check-plant-name', async (req, res) => {
  const { plantName } = req.body;

  if (!plantName) {
    return res.status(400).json({ message: "Missing plant name" });
  }

  try {
    const exists = await Leaderboard.findOne({ plantName: new RegExp(`^${plantName}$`, 'i') });

    if (exists) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (err) {
    console.error("Error checking plant name:", err);
    res.status(500).json({ message: "Server error" });
  }
});

function getScoreForPlant(plantType, temperature, humidity, moisture) {
  const ranges = {
    tomato:   { temp: [20, 27], humidity: [50, 70], moisture: [60, 80] },
    basil:    { temp: [21, 26], humidity: [40, 60], moisture: [50, 70] },
    spinach:  { temp: [15, 21], humidity: [40, 70], moisture: [70, 90] }
  };

  const plant = ranges[plantType?.toLowerCase()];
  if (!plant) return null;

  let score = 0;

  function scoreRange(value, [low, high], weight = 1) {
    if (typeof value !== "number") return 0;
    if (value >= low && value <= high) return 100 * weight;
    const dist = value < low ? low - value : value - high;
    return Math.max(0, 100 - dist * 10) * weight;
  }

  score += scoreRange(temperature, plant.temp, 0.4);
  score += scoreRange(humidity, plant.humidity, 0.3);
  score += scoreRange(moisture, plant.moisture, 0.3);

  return Math.round(score);
}



// Update plant info
app.post('/update', async (req, res) => {
  const { device_id, plantName, plantType, birthday, temperature, humidity, moisture } = req.body;
  const safeBirthday = birthday ? new Date(birthday) : null;

  if (!device_id) {
    return res.status(400).json({ message: "Missing device ID" });
  }

  const score = getScoreForPlant(plantType, temperature, humidity, moisture);


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

// Leaderboard data
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
