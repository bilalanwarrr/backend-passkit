const express = require("express");
const router = express.Router();
const imagesController = require("../controllers/imagesController");
const multer = require("multer");

const upload = multer({ dest: "templateImages/" });

router.post(
  "/",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "appleLogo", maxCount: 1 },
    { name: "hero", maxCount: 1 },
    { name: "strip", maxCount: 1 },
  ]),
  imagesController.generateImagesObjects
);

module.exports = router;
