const requestController = require('../controller/requestController')
const router= require('express').Router()

router.get('/',requestController.getAll);
router.post('/',requestController.create);

module.exports = router;