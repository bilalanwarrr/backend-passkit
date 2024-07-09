const express = require("express");
const router = express.Router();
const templateController = require("../controllers/templateController");

router.post("/create", templateController.generateTemplate);
router.get("/", templateController.getListOfTemplates);
router.delete("/", templateController.deleteTemplate);

module.exports = router;
