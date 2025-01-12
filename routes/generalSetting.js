const router = require('express').Router()
const generalSettingController = require('../controller/generalSettingController')

router.get('/', generalSettingController.getAll);

module.exports = router;