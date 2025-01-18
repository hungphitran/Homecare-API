const generalController = require("../controller/generalController")

const router= require('express').Router()

router.get('/',generalController.getAll)

module.exports = router;