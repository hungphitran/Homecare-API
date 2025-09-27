const express = require("express");
const payOS = require("../controller/payosController");
const { authenticateToken, requireHelper, requireCustomer, requireOwnership } = require('../middleware/auth')
const payos = require("../config/payos");


const router = express.Router();

router.post("/create-payment-link", payOS.createPaymentLink);
router.post("/webhook", payOS.webhook);
// Endpoint kiểm tra thông tin từ PayOS
router.get("/check-info", async (req, res) => {
    try {

        res.json(req.body);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi khi lấy thông tin" });
    }
});

module.exports = router;
