const blogController = require('../controller/blogController')
const router = require('express').Router()
router.get('/:id',blogController.getOne)
router.get('/',blogController.getAll)

module.exports = router;
