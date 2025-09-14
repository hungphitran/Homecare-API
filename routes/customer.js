const customerController = require('../controller/customerController')
const router = require('express').Router()
const { authenticateToken, requireOwnership } = require('../middleware/auth')


// Customer can get their own info only
router.get('/:phone', authenticateToken, requireOwnership, customerController.getOne)

// Customer can update their own info only
router.patch('/:phone', authenticateToken, requireOwnership, customerController.update)

module.exports = router;
