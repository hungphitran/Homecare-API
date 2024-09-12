const customerController = require('../controller/customerController')
const router = require('express').Router()


router.post('/',customerController.create)
router.get('/',customerController.get)
module.exports = router;
