const timeOffController = require('../controller/timeOffController');
const router = require('express').Router();
const { authenticateToken, requireHelper } = require('../middleware/auth')

// Helper can get their own time off
router.get('/:id', authenticateToken, requireHelper, timeOffController.getAll);

module.exports = router;