const customerController = require('../controller/customerController')
const router = require('express').Router()


router.patch('/:phone',customerController.update)
router.get('/:phone',customerController.getOne)
router.post('/',customerController.create)
router.get('/',customerController.getAll)
module.exports = router;
