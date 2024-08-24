const router = require('express').Router()
const {helperController} =require('../controller/helperController')
router.get('/',helperController.get)

module.exports =router;