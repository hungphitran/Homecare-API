const costFactorController = require('../controller/costFactorController');
const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth')

// Cost factors are needed for cost calculation, accessible to all authenticated users
router.get('/other', costFactorController.getOther);
router.get('/service',  costFactorController.getService);
router.get('/', costFactorController.getAll);

module.exports = router;