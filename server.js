const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB (replace <YOUR_MONGODB_URI> below)
mongoose
  .connect(
    "mongodb+srv://varunkumarkgowda204:xgB3DBTBvwxsd8rD@cluster0.koz4szm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define a Match schema
const matchSchema = new mongoose.Schema({
  team1: String,
  team2: String,
  sets1: Number, // (optional: can be calculated from setScores)
  sets2: Number, // (optional: can be calculated from setScores)
  setScores: [
    {
      team1: Number, // team1's score in this set
      team2: Number  // team2's score in this set
    }
  ],
  playedAt: { type: Date, default: Date.now }
});

const Match = mongoose.model('Match', matchSchema);

// Routes

// Get all matches
app.get('/matches', async (req, res) => {
  const matches = await Match.find().sort({ playedAt: 1 });
  res.json(matches);
});

// Add a new match
app.post('/matches', async (req, res) => {
  const { team1, team2, setScores } = req.body;
  if (!team1 || !team2 || !Array.isArray(setScores)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let sets1 = 0, sets2 = 0;
  setScores.forEach(set => {
    if (set.team1 > set.team2) sets1++;
    else if (set.team2 > set.team1) sets2++;
  });

  const match = new Match({ team1, team2, sets1, sets2, setScores });
  await match.save();
  res.status(201).json(match);
});

// Update a match by ID
app.put('/matches/:id', async (req, res) => {
  const { sets1, sets2 } = req.body;
  console.log("Update request for ID:", req.params.id, "with", sets1, sets2);


  if (sets1 === undefined || sets2 === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }


  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { sets1, sets2 },
      { new: true }
    );


    if (!match) {
      console.log("Match not found for ID:", req.params.id);
      return res.status(404).json({ error: 'Match not found' });
    }


    res.json(match);
  } catch (error) {
    console.error("Error updating match:", error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// Delete a match by ID
app.delete('/matches/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json({ message: 'Match deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset all matches
app.delete('/matches', async (req, res) => {
  await Match.deleteMany({});
  res.json({ message: 'All matches deleted' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
