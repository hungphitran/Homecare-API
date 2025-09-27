const e = require('express');
const payOS = require("../config/payos");
const Request = require('../model/request.model')
const RequestDetail = require('../model/requestDetail.model')
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const payosController = {
    createPaymentLink: async (req, res) => {
        let request = await Request.findOne({ _id: new mongoose.Types.ObjectId( req.body.requestId )  })
        
        if (request && request.status === 'completed') {
            return res.status(400).json({ error: 'Yêu cầu đã được thanh toán' });
        }
        let amount =0

        for(let scheduleId of request.scheduleIds){
            let schedule = await RequestDetail.findOne({
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
            orderCode: Date.now() + Math.floor(Math.random() * 1000),
            // amount: amount,
            amount: 10000, // test
            description: req.body.requestId,
            returnUrl: `${req.body.fe_host}/payment-success`,
            cancelUrl: `${req.body.fe_host}/payment-cancel`,
        }).then(paymentLink => {
            res.status(200).json(paymentLink);
        }).catch(err => {
            console.error(err);
            res.status(500).json({ error: err.message });
        });
    },
    webhook: async (req, res) => {
        try {
            const valid = await payOS.webhooks.verify(req.body);
            if (!valid) return res.status(400).send('Invalid');
            console.log('Webhook received:', req.body);
            // Cập nhật trạng thái đơn hàng
            const { description, status } = req.body;

                let request = await Request.findOne({ _id: new mongoose.Types.ObjectId(description)  })
                if (request) {
                    request.status = 'completed';
                    await request.save();
                }
                else{
                    console.log(`Order ${orderCode} not found in DB`);
                }
        } catch (err) {
        console.error(err);
            res.status(500).send('Internal Server Error');
        }        
        // Xử lý sự kiện từ PayOS ở đây
        res.status(200).send('OK');
    }
};
module.exports = payosController