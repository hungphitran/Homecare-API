const {staffController} = require("../controller/staffController")
const router =require('express').Router()

router.get('/',staffController.getAll);

module.exports =router;