const policyController = require("../controller/policyController");
const express = require("express");
const router = express.Router();

router.get("/", policyController.getAll);
module.exports = router;