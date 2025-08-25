const express = require('express');
const path = require('path');
const axios = require('axios');
const http = require('http');
const { PassThrough } = require('stream');
const app = express();

app.use(express.json()); // parse JSON body
app.use(express.static(path.join(__dirname, 'build')));

const multer = require('multer');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Tạo folder nếu chưa có
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// POST /api/upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Trả về path để frontend gửi lên Flask
  // Trả đường dẫn tuyệt đối để Flask đọc
  const absolutePath = path.join(UPLOAD_DIR, req.file.filename);
  res.json({ path: absolutePath });
});

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
  const backendUrl = 'http://192.168.1.220:8001/generate';
  const clientReqBody = JSON.stringify(req.body);

  const backendReq = http.request(
    backendUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(clientReqBody),
      },
    },
    (backendRes) => {
      res.status(backendRes.statusCode);
      res.setHeader('Content-Type', backendRes.headers['content-type'] || 'text/event-stream');
      backendRes.on('data', (chunk) => {
        console.log('Node proxy chunk:', chunk.toString()); // Log chunk nhận từ Flask
      });
      backendRes.on('end', () => {
        console.log('Node proxy stream done');
      });
      backendRes.pipe(res);
    }
  );

  backendReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  backendReq.write(clientReqBody);
  backendReq.end();
});

// Serve React build
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(3000, () => console.log('Node server running on port 3000'));
