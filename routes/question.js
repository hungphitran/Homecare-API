const questionController = require("../controller/questionController");
const express = require("express");
const router = express.Router();

router.get("/", questionController.getAll);
module.exports = router;