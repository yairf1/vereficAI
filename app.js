// app.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. הגדרת תיקיית static
app.use(express.static(path.join(__dirname, 'public')));

// 2. ניתובים (routes) לכל דף HTML
app.get('/', (req, res) => {
// אפשר להפנות ישר ל־home.html
  res.sendFile(path.join(__dirname, 'public', 'HomePage', 'home.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aboutPage', 'about.html'));
});

app.get('/solution', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'solution', 'solution.html'));
});

// 3. הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
