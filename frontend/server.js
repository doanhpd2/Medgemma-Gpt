const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

app.use(express.json()); // parse JSON body
app.use(express.static(path.join(__dirname, 'build')));

// Proxy /api/health → backend MedGemma
app.get('/api/health', async (req, res) => {
  try {
    const response = await axios.get('http://192.168.1.220:8001/health');
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy /api/generate → backend MedGemma
app.post('/api/generate', async (req, res) => {
  try {
    const response = await axios.post('http://192.168.1.220:8001/generate', req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve React build
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(3000, () => console.log('Node server running on port 3000'));
