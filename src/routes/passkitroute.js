const express = require('express');
const router = express.Router();
const passkitController = require('../controllers/passkitcontroller'); 

router.post('/coupons/singleUseCampaign', passkitController.createSingleUseCouponCampaign);
router.post('/coupons/singleUseOffer', passkitController.createSingleUseCouponOffer);
router.post('/coupons/singleUseCoupon', passkitController.createSingleUseCoupon);

module.exports = router;