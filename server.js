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

// Connect to Mongo Atlas with Mongoose
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(`Connected to MongoDB Atlas, using database: ${mongoose.connection.db.databaseName}`))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schema & Model
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

// Endpoint to receive data from ESP32 or form
app.post('/update', async (req, res) => {
    const { device_id, plantName, plantType, birthday, temperature, humidity, moisture } = req.body;

    if (!device_id) {
        return res.status(400).send("Missing device ID");
    }

    console.log("Received sensor data:", req.body);

    // Only calculate score if all sensor values are present
    let score = null;
    if (
        typeof temperature === 'number' &&
        typeof humidity === 'number' &&
        typeof moisture === 'number'
    ) {
        score = (100 - Math.abs(temperature - 25)) + (humidity / 2) + (moisture / 10);
    }

    const updateFields = {
        device_id,
        plantName,
        plantType,
        birthday: birthday ? new Date(birthday) : null,
        lastUpdated: new Date()
    };

    if (typeof temperature === 'number') updateFields.temperature = temperature;
    if (typeof humidity === 'number') updateFields.humidity = humidity;
    if (typeof moisture === 'number') updateFields.moisture = moisture;
    if (typeof score === 'number') updateFields.score = score;

    try {
        const result = await Leaderboard.updateOne(
            { device_id },
            { $set: updateFields },
            { upsert: true }
        );

        res.status(200).json({ message: "Data received & score updated", score });
    } catch (error) {
        console.error("Error updating leaderboard:", error);
        res.status(500).send("Database update error");
    }
});

// Endpoint to fetch leaderboard
app.get('/leaderboard', async (req, res) => {
    const { plantType } = req.query;

    try {
        const filter = plantType ? { plantType } : {};
        const leaderboard = await Leaderboard.find(filter).sort({ score: -1 });

        if (!leaderboard.length) {
            return res.status(404).json({ message: "No leaderboard data found" });
        }

        res.json(leaderboard);
    } catch (error) {
        console.error("Error retrieving leaderboard:", error);
        res.status(500).send("Internal server error");
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
