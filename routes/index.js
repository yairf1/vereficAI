const {Router} = require('express');
const router = Router();

const about = require('../routes/about/about.js');
const home = require('../routes/Home/home.js');
const solution = require('../routes/solution/solution.js');
const team = require('../routes/team/team.js');

router.use('/about', about);
router.use('/', home);
router.use('/solution', solution);
router.use('/team', team);

module.exports = router;
