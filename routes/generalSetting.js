const generalSettingController = require("../controller/generalSettingController");
const router = require('express').Router();

router.get('/', generalSettingController.get);

module.exports = router;