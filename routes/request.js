const requestController = require('../controller/requestController')
const router = require('express').Router()
const { authenticateToken, requireHelper, requireCustomer, requireOwnership } = require('../middleware/auth')

// Public - calculate cost (không cần xác thực để estimate)
router.post('/calculateCost', requestController.calculateCost);

// Helper only - payment and work status management (confirm -> inProgress -> waitPayment -> completed)
router.post('/finishpayment', authenticateToken, requireHelper, requestController.finishPayment)
router.post('/finish', authenticateToken, requireHelper, requestController.finishRequest)
router.post('/processing', authenticateToken, requireHelper, requestController.startWork)

// Helper only - assignment and management
router.post('/assign', authenticateToken, requireHelper, requestController.assign)
// router.post('/reject', authenticateToken, requireHelper, requestController.rejectHelper)

// Customer can cancel their own requests
router.post('/cancel', authenticateToken, requireCustomer, requestController.cancelRequest)

// Customer can get their own requests
router.get('/:phone', authenticateToken, requireOwnership, requestController.getByPhone);

// Admin/Helper can get all requests (thêm route mới)
router.get('/', authenticateToken, requireHelper, requestController.getAll);

// Customer can create requests
router.post('/', authenticateToken, requireCustomer, requestController.create);

module.exports = router;