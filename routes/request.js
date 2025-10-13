const requestController = require('../controller/requestController')
const router = require('express').Router()
const { authenticateToken, requireHelper, requireCustomer, requireOwnership } = require('../middleware/auth')


// Get request details by ID (for both customer and helper, must come before other GET routes)
router.get('/detail/:id', authenticateToken, requestController.getOneById);


// Public - calculate cost (không cần xác thực để estimate)
router.post('/calculateCost', requestController.calculateCost);

// Helper only - payment and work status management (assigned -> inProgress -> waitPayment -> completed)
router.post('/finishpayment', authenticateToken, requestController.finishPayment)
router.post('/finish', authenticateToken, requireHelper, requestController.finishRequest)
router.post('/processing', authenticateToken, requireHelper, requestController.startWork)

// Helper only - assignment and management
router.post('/assign', authenticateToken, requireHelper, requestController.assign)
// router.post('/reject', authenticateToken, requireHelper, requestController.rejectHelper)
router.get('/test-helpercost',requestController.testHelperCost);

// Customer can cancel their own requests
router.post('/cancel', authenticateToken, requireCustomer, requestController.cancelRequest)


// Admin/Helper can get all available requests (chưa có helper)
router.get('/', authenticateToken, requireHelper, requestController.getAll);


// Helper can get their assigned requests
router.get('/my-assigned', authenticateToken, requireHelper, requestController.getMyAssignedRequests);

// Customer can get their own requests (must come after other specific routes)
router.get('/:phone', authenticateToken, requireOwnership, requestController.getByPhone);
router.get('/helper/:helper_id', authenticateToken, requireCustomer, requestController.getAllHelperRequests);



// Customer can create requests
router.post('/', authenticateToken, requireCustomer, requestController.create);

module.exports = router;