
const {Router} = require('express');
const router = Router();

const about = require('./about/about.js');
const home = require('./home/home.js');
const solution = require('./solution/solution.js');

router.use('/about', about);
router.use('/', home);
router.use('/solution', solution);

module.exports = router;
