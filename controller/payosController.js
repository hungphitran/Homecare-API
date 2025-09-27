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
  try {
    const verified = payOS.verifyPaymentWebhookData(req.body);

    if (verified) {
      console.log("Thanh toán thành công:", req.body);
      // TODO: cập nhật DB, trạng thái đơn hàng...
      res.sendStatus(200);
    } else {
      res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Webhook lỗi" });
  }
    }
};
module.exports = payosController