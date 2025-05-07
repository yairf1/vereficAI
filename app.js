// app.js
const express = require('express');
const path = require('path');
const router = require('./routes/index.js');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. הגדרת תיקיית static
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router);

// 3. הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
