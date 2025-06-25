const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'));
app.use(express.json());

let raceData = {
  track: '',
  distance: '',
  fractions: []
};

app.post('/api/setRace', (req, res) => {
  const { track, distance } = req.body;
  raceData.track = track;
  raceData.distance = distance;
  raceData.fractions = [];
  res.json({ status: 'ok', message: 'Race initialized' });
});

app.post('/api/addFraction', (req, res) => {
  const { label, time } = req.body;
  raceData.fractions.push({ Distance: label, Time: time });
  res.json({ status: 'ok', message: 'Fraction recorded' });
});

app.get('/api/json', (req, res) => {
  res.json(raceData);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Harness timer running at http://localhost:${PORT}`);
});
