const express = require("express");
const router = express.Router()
const locationRouter = require('./location')
const helperRouter = require('./helper')
const blogRouter=require('./blog')
const serviceRouter = require('./service')
const requestRouter = require('./request')
const customerRouter = require('./customer');
const messageRouter= require('./message')

router.use('/blog',blogRouter)
router.use('/message',messageRouter)
router.use('/customer', customerRouter)
router.use('/request', requestRouter);
router.use('/service', serviceRouter);
router.use('/location', locationRouter);
router.use('/helper', helperRouter)


module.exports = router;