const serviceController= require('../controller/serviceController')
const router = require('express').Router()
router.get('/:idOrTitle',serviceController.getOneById)
router.get('/',serviceController.getAll);

module.exports=router;