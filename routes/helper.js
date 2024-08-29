const router = require('express').Router()
const {helperController} =require('../controller/helperController')
router.get('/:id',helperController.getById)
router.get('/',helperController.getAll)

module.exports =router;