// app.js
const express = require('express');
const path = require('path');
const router = require('./routes/index.js');
const app = express();
const PORT = process.env.PORT || 3000;

//  middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router);

// Starting the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
