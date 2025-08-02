const generalController = require("../controller/generalController")
const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')

// General settings are needed for business logic, accessible to all authenticated users
router.get('/', authenticateToken, generalController.getAll)

module.exports = router;