const discountController = require('../controller/discountController');
const express = require('express');
const router = express.Router();

// Public - customers can view available discounts
router.get('/', discountController.getAll);

module.exports = router;