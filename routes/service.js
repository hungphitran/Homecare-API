const {serviceController}= require('../controller/serviceController')
const router = require('express').Router()
router.get('/:title',serviceController.getOneByTitle)
router.get('/',serviceController.getAll);

module.exports=router;