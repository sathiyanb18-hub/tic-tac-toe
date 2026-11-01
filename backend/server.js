const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'games.json');

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// ---------- helpers: read/write the JSON file ----------
function readGames() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return []; // file doesn't exist yet
  }
}

function writeGames(games) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2));
}

// ---------- routes ----------
app.get('/', (req, res) => res.json({ status: 'Tic Tac Toe API running' }));

// Save a finished game
app.post('/api/games', (req, res) => {
  const { winner, mode, moves } = req.body;
  if (!['X', 'O', 'draw'].includes(winner)) {
    return res.status(400).json({ error: 'Invalid winner value' });
  }
  const game = {
    id: Date.now().toString(),
    winner,
    mode: mode === 'cpu' ? 'cpu' : 'pvp',
    moves: Array.isArray(moves) ? moves : [],
    createdAt: new Date().toISOString(),
  };
  const games = readGames();
  games.push(game);
  writeGames(games);
  res.status(201).json(game);
});

// Get the 10 most recent games (newest first)
app.get('/api/games', (req, res) => {
  res.json(readGames().slice(-10).reverse());
});

// Get win totals
app.get('/api/games/stats', (req, res) => {
  const stats = { X: 0, O: 0, draw: 0 };
  readGames().forEach((g) => (stats[g.winner] += 1));
  res.json(stats);
});

// Clear history
app.delete('/api/games', (req, res) => {
  writeGames([]);
  res.json({ message: 'History cleared' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));