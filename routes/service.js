const {serviceController}= require('../controller/serviceController')
const router = require('express').Router()

router.get('/',serviceController.getService);

module.exports=router;