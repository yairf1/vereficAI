const {Router} = require('express');
const express = require('express');
const router = Router();
const path = require('path');
const express = require('express');
const cors = require('cors'); // ← import cors
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { OPENAI_API_KEY, PORT = 5000 } = process.env;
if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY in .env');
  process.exit(1);
}

router.get('/solution', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'solution', 'solution.html'));
});

// allow only localhost:3000 (your React/Vite/etc. dev server)
router.use(
  cors({ origin: 'http://localhost:3000', methods: ['GET', 'POST', 'OPTIONS'] })
);
// allow pre-flights on all routes
router.options('*', cors({ origin: 'http://localhost:3000' }));

// 2) JSON parser
router.use(express.json());

// (the rest stays the same)
router.use(express.static(path.join(__dirname, '../public')));

router.post('/api/checkReliability', async (req, res) => {
  // …
});

module.exports = router;