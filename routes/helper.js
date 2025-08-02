const router = require('express').Router()
const helperController = require('../controller/helperController')

// Public - get helper details (for customers to see helper profiles)
router.get('/:id', helperController.getOneById);

// Public - get all helpers (public info only)
router.get('/', helperController.getAll)

module.exports = router;