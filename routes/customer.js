const customerController = require('../controller/customerController')
const router = require('express').Router()

router.get('/',customerController.get)
router.post('/',customerController.create)

module.exports = router;
