const express = require("express");
const router = express.Router()
const locationRouter = require('./location')
const helperRouter = require('./helper')
//const staffRouter=require('./staff')
const serviceRouter = require('./service')
const requestRouter = require('./request')
const customerRouter = require('./customer');
router.use('/customer', customerRouter)
router.use('/request', requestRouter);
router.use('/service', serviceRouter);
//router.use('/staff',staffRouter);
router.use('/location', locationRouter);
router.use('/helper', helperRouter)


module.exports = router;