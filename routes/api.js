const express = require("express");
const router =express.Router()
const locationRouter= require('./location')
const helperRouter =require('./helper')

router.use('/location',locationRouter);
router.use('/helper',helperRouter)


module.exports=router;