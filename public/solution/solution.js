// server/server.js
const path    = require('path');
const express = require('express');
const cors    = require('cors');            // ← import cors
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { OPENAI_API_KEY, PORT = 5000 } = process.env;
if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY in .env');
  process.exit(1);
}

// 1) Enable CORS for your front-end
app = express();
// allow only localhost:3000 (your React/Vite/etc. dev server)
app.use(cors({ origin: 'http://localhost:3000', methods: ['GET','POST','OPTIONS'] }));
// allow pre-flights on all routes
app.options('*', cors({ origin: 'http://localhost:3000' }));

// 2) JSON parser
app.use(express.json());

// (the rest stays the same)
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/checkReliability', async (req, res) => {
  // …
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
