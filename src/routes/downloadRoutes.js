const express = require("express");
const router = express.Router();
const downloadController = require("../controllers/downloadController");

router.get("/", downloadController.donwloadOutputFile);

module.exports = router;
