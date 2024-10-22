const requestDetailController = require('../controller/requestDetailController')
const router= require('express').Router()

router.post('/',requestDetailController.create);
router.get('/',requestDetailController.getByIds);

module.exports = router;