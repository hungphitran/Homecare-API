const router = require('express').Router()
const {locationController} =require('../controller/locationController')
router.get('/',locationController.get)

module.exports =router;