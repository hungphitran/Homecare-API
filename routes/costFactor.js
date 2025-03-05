const costFactorController = require('../controller/costFactorController');
const router = require('express').Router();

router.get('/other', costFactorController.getOther);
router.get('/service', costFactorController.getService);
router.get('/', costFactorController.getAll);

module.exports = router;