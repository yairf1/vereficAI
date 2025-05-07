const {Router} = require('express');
const express = require('express');
const router = Router();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'solution', 'solution.html'));
});

router.post('/api/checkReliability', async (req, res) => {
  // …
});

module.exports = router;