const requestController = require('../controller/requestController')
const router= require('express').Router()

router.get('/',requestController.get);
router.post('/',requestController.create);

module.exports = router;