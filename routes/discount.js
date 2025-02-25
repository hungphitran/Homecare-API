const discountController = require('../controller/discountController');
const express = require('express');
const router = express.Router();

router.get('/', discountController.getAll);


module.exports = router;