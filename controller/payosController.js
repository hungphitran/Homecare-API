const e = require('express');
const payOS = require("../config/payos");

const payosController = {
    createPaymentLink: async (req, res) => {
        payOS.paymentRequests.create({
            orderCode: req.body.orderCode || Date.now(), // cần unique
            amount: req.body.amount,
            description: req.body.description || "Thanh toán đơn hàng",
            returnUrl: `${req.body.fe_host}/payment-success`,
            cancelUrl: `${req.body.fe_host}/payment-cancel`,
        }).then(paymentLink => {
            res.json(paymentLink);
        }).catch(err => {
            console.error(err);
            res.status(500).json({ error: err.message });
        });
    },
    webhook: async (req, res) => {
        const event = req.body;
        console.log("Received webhook event:", event);
        // Xử lý sự kiện từ PayOS ở đây
        res.status(200).send('OK');
    }
};
module.exports = payosController