const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const dgram = require('dgram');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === Middleware ===
app.use(express.static('public'));
app.use(express.json());

// === Race Data Storage ===
let raceData = {
  track: '',
  distance: '',
  fractions: []
};

// === Optional UDP Setup ===
const udpClient = dgram.createSocket('udp4');
let udpTarget = { ip: '', port: 0 }; // set this via POST if needed

// === WebSocket Connections ===
let wsClients = [];

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  wsClients.push(ws);
  ws.send(JSON.stringify(raceData));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients = wsClients.filter(client => client !== ws);
  });
});

function broadcastRaceData() {
  const message = JSON.stringify(raceData);
  wsClients.forEach(ws => {
    try {
      ws.send(message);
    } catch (err) {
      console.log('WebSocket send error:', err.message);
    }
  });
}

// === Routes ===

// Reset entire race
app.post('/api/setRace', (req, res) => {
  const { track, distance } = req.body;
  raceData = { track, distance, fractions: [] };
  res.json({ status: 'ok', message: 'Race initialized' });
});

// Clear only fractions
app.post('/api/resetRace', (req, res) => {
  raceData.fractions = [];
  res.json({ status: 'ok', message: 'Fractions cleared' });
});

// Set UDP Target
app.post('/api/setUdpTarget', (req, res) => {
  const { ip, port } = req.body;
  udpTarget = { ip, port: parseInt(port) };
  res.json({ status: 'ok', message: `UDP target set to ${ip}:${port}` });
});

// Add a fraction and broadcast
app.post('/api/addFraction', (req, res) => {
  const { label, time } = req.body;
  const fraction = { Distance: label, Time: time };
  raceData.fractions.push(fraction);

  // Optional: Send to UDP
  if (udpTarget.ip && udpTarget.port) {
    const udpMsg = Buffer.from(JSON.stringify(fraction));
    udpClient.send(udpMsg, udpTarget.port, udpTarget.ip, (err) => {
      if (err) console.error('UDP send error:', err.message);
    });
  }

  // Broadcast to WebSocket clients
  broadcastRaceData();

  res.json({ status: 'ok', message: 'Fraction recorded and broadcasted' });
});

// Get full race JSON
app.get('/api/json', (req, res) => {
  res.json(raceData);
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Start server ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Harness timer running on port ${PORT}`);
});
