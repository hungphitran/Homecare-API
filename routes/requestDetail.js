const requestDetailController = require('../controller/requestDetailController')
const router= require('express').Router()

router.post('/review',requestDetailController.postReview)
router.get('/helper/:id',requestDetailController.getByHelperId);
router.get('/',requestDetailController.getByIds);



module.exports = router;