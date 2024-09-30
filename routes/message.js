const messageController= require('../controller/messageController')
const router= require('express').Router()

router.post('/',messageController.send)
router.get('/',messageController.get)


module.exports=router;