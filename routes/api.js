const express = require("express");
const router =express.Router()
const locationRouter= require('./location')
const helperRouter =require('./helper')
const staffRouter=require('./staff')
const serviceRouter =require('./service')
router.use('/service',serviceRouter);
router.use('/staff',staffRouter);
router.use('/location',locationRouter);
router.use('/helper',helperRouter)


module.exports=router;