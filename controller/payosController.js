const e = require('express');
const payOS = require("../config/payos");
const Request = require('../model/request.model')
const RequestDetail = require('../model/requestDetail.model')
const mongoose = require('mongoose');
const payosController = {
    createPaymentLink: async (req, res) => {
        let request = await Request.findOne({ _id: new mongoose.Types.ObjectId( req.body.requestId )  })
        
        if (request && request.status === 'completed') {
            return res.status(400).json({ error: 'Yêu cầu đã được thanh toán' });
        }
        let amount =0

        for(let scheduleId of request.scheduleIds){
            let schedule = await RequestDetail.find({
                _id: new mongoose.Types.ObjectId(scheduleId),
                 status:'completed'})
            if(schedule){
                amount += schedule.cost
            }
        }
        if(amount == 0 || !amount){
            return res.status(400).json({ error: 'Yêu cầu không có chi phí để thanh toán' });
        }

        payOS.paymentRequests.create({
            orderCode: req.body.requestId || Date.now(), // cần unique
            amount: amount,
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
            const valid = await payOS.verifyPaymentWebhookData(req.body);
            if (!valid) return res.status(400).send('Invalid');

            // Cập nhật trạng thái đơn hàng
            const { orderCode, status } = req.body;
            if (status === 'PAID') {
            // mark order as paid in DB
            console.log(`Order ${orderCode} marked as PAID`);
                let request = await Request.findOne({ _id: new mongoose.Types.ObjectId(orderCode)  })
                if (request) {
                    request.status = 'completed';
                    await request.save();
                }
                else{
                    console.log(`Order ${orderCode} not found in DB`);
                }
                
            } else if (status === 'FAILED') {
            // mark order as failed in DB
            console.log(`Order ${orderCode} marked as FAILED`);
            }
            res.status(200).send('OK');
        } catch (err) {
        console.error(err);
            res.status(500).send('Internal Server Error');
        }        
        console.log("Received webhook event:", event);
        // Xử lý sự kiện từ PayOS ở đây
        res.status(200).send('OK');
    }
};
module.exports = payosController