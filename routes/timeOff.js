const timeOffController = require('../controller/timeOffController');
const router = require('express').Router();

router.get('/test', timeOffController.test);
router.get('/:id', timeOffController.getAll);

module.exports = router;