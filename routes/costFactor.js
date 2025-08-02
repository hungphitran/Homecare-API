const costFactorController = require('../controller/costFactorController');
const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth')

// Cost factors are needed for cost calculation, accessible to all authenticated users
router.get('/other', authenticateToken, costFactorController.getOther);
router.get('/service', authenticateToken, costFactorController.getService);
router.get('/', authenticateToken, costFactorController.getAll);

module.exports = router;