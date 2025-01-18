const costFactorController = require('../controller/costFactorController');
const router = require('express').Router();

router.get('/', costFactorController.getAll);

module.exports = router;