const router = require('express').Router()
const helperController = require('../controller/helperController')
const { authenticateToken } = require('../middleware/auth');

//change status of the helper
router.patch('/status/:id',authenticateToken, helperController.changeWorkingStatus);

// Public - get helper details (for customers to see helper profiles)
router.get('/:id', helperController.getOneById);

// Public - get all helpers (public info only)
router.get('/', helperController.getAll)

module.exports = router;