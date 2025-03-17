const requestDetailController = require('../controller/requestDetailController')
const router= require('express').Router()

router.get('/',requestDetailController.getByIds);
router.get('/helper/:id',requestDetailController.getByHelperId);

module.exports = router;