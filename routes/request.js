const requestController = require('../controller/requestController')
const router= require('express').Router()

router.post('/calculateCost',requestController.calculateCost);
router.post('/finishpayment',requestController.finishPayment)
router.post('/finish',requestController.finishRequest)
router.post('/processing',requestController.startWork)
router.post('/assign',requestController.assign)
router.post('/cancel',requestController.cancelRequest)
router.get('/:phone',requestController.getByPhone);
router.get('/',requestController.getAll);
router.post('/',requestController.create);

module.exports = router;