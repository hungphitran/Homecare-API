const express = require("express");
const payOS = require("../controller/payosController");
const { authenticateToken, requireHelper, requireCustomer, requireOwnership } = require('../middleware/auth')
const payos = require("../config/payos");


const router = express.Router();

router.post("/create-payment-link", payOS.createPaymentLink);
router.post("/webhook", payOS.webhook);
router.post('/checkpayment', payOS.checkPaymentStatus);


module.exports = router;
