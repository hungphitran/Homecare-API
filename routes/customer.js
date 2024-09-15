const customerController = require('../controller/customerController')
const router = require('express').Router()

router.get('/:phone',customerController.getOne)
router.post('/',customerController.create)
router.get('/',customerController.getAll)
module.exports = router;
