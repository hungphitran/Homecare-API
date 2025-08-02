const requestDetailController = require('../controller/requestDetailController')
const router = require('express').Router()
const { authenticateToken, requireHelper, requireCustomer } = require('../middleware/auth')

// Customer can post review for their requests
router.post('/review', authenticateToken, requireCustomer, requestDetailController.postReview)

// Helper can get their own request details
router.get('/helper/:id', authenticateToken, requireHelper, requestDetailController.getByHelperId);

// Get request details by IDs (accessible to authenticated users)
router.get('/', authenticateToken, requestDetailController.getByIds);

module.exports = router;