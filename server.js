const express = require('express');
const app = express();
const dgram = require('dgram');
const net = require('net');
const path = require('path');

app.use(express.static('public'));
app.use(express.json());

let raceData = {
  track: '',
  distance: '',
  fractions: []
};

// Store connected TCP clients
const tcpClients = [];

// TCP Server to broadcast JSON
const tcpServer = net.createServer((socket) => {
  console.log('TCP client connected');
  tcpClients.push(socket);

  socket.on('end', () => {
    console.log('TCP client disconnected');
    const index = tcpClients.indexOf(socket);
    if (index !== -1) tcpClients.splice(index, 1);
  });

  socket.on('error', (err) => {
    console.log('TCP client error:', err.message);
  });
});

tcpServer.listen(1001, () => {
  console.log('TCP server listening on port 1001');
});

function broadcastRaceData() {
  const json = JSON.stringify(raceData);
  tcpClients.forEach((client) => {
    try {
      client.write(json + '\n');
    } catch (err) {
      console.log('TCP broadcast error:', err.message);
    }
  });
}


app.post('/api/setRace', (req, res) => {
  const { track, distance } = req.body;

  // ✅ This resets the full raceData
  raceData = {
    track,
    distance,
    fractions: []
  };

  res.json({ status: 'ok', message: 'Race initialized' });
});

app.post('/api/resetRace', (req, res) => {
  raceData.fractions = [];
  res.json({ status: 'ok', message: 'Race fractions cleared' });
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

app.post('/api/addFraction', (req, res) => {
  const { label, time } = req.body;
  const fraction = { Distance: label, Time: time };
  raceData.fractions.push(fraction);

  // Send to UDP if configured
  if (udpTarget.ip && udpTarget.port) {
    const message = Buffer.from(JSON.stringify(fraction));
    udpClient.send(message, udpTarget.port, udpTarget.ip, (err) => {
      if (err) console.error('UDP send error:', err);
    });
  }

  // ✅ Send full JSON to TCP clients
  broadcastRaceData();

  res.json({ status: 'ok', message: 'Fraction recorded and pushed' });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Harness timer running at http://localhost:${PORT}`);
});
