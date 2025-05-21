
const {Router} = require('express');
const router = Router();

const about = require('../routes/about/about.js');
const home = require('../routes/home/home.js');
const solution = require('../routes/solution/solution.js');

router.use('/about', about);
router.use('/', home);
router.use('/solution', solution);

module.exports = router;
