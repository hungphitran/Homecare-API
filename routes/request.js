const requestController = require('../controller/requestController')
const router= require('express').Router()

router.get('/:phone',requestController.getByPhone);
router.get('/',requestController.getAll);
router.post('/',requestController.create);

module.exports = router;