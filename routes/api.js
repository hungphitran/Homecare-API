const express = require("express");
const router = express.Router()
const locationRouter = require('./location')
const helperRouter = require('./helper')
const blogRouter = require('./blog')
const serviceRouter = require('./service')
const requestRouter = require('./request')
const customerRouter = require('./customer');
const requestDetailRouter = require('./requestDetail')
const timeOffRouter = require('./timeOff')
const costFactorRouter = require('./costFactor')
const authRouter = require('./auth') // Thêm auth router
const notificationRouter = require('./notification')

const generalRouter = require('./general')
const policyRouter = require('./policy')
const questionRouter = require('./question')
const discountRouter = require('./discount');

// Authentication routes
router.use('/auth', authRouter)

router.use('/blog', blogRouter)
router.use('/customer', customerRouter)
router.use('/request', requestRouter);
router.use('/service', serviceRouter);
router.use('/location', locationRouter);
router.use('/helper', helperRouter)
router.use('/requestDetail', requestDetailRouter)
router.use('/timeOff', timeOffRouter)
router.use('/costFactor', costFactorRouter)
router.use('/general', generalRouter);
router.use('/policy', policyRouter);
router.use('/question', questionRouter);
router.use('/discount', discountRouter);
router.use('/notifications', notificationRouter);
module.exports = router;