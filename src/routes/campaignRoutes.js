const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");

router.get("/", campaignController.getListOfCampaigns);
router.post("/create", campaignController.createCampaign);
router.delete("/", campaignController.deleteCampaigns);


module.exports = router;
