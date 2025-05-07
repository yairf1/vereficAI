const {Router} = require('express');
const express = require('express');
const router = Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'aboutPage', 'about.html'));
});

module.exports = router;