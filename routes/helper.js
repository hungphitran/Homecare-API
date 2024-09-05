const router = require('express').Router()
const {helperController} =require('../controller/helperController')
router.get('/:slug',helperController.getWithFilter)
router.get('/',helperController.getAll)

module.exports =router;