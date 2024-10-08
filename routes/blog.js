const blogController = require('../controller/blogController')
const router = require('express').Router()

router.get('/',blogController.get)

module.exports = router;
