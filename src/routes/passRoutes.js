const express = require("express");
const router = express.Router();
const passController = require("../controllers/passController");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.post(
  "/create",
  upload.fields([
    { name: "offers", maxCount: 1 },
    { name: "users", maxCount: 1 },
  ]),
  passController.passCreation
);

module.exports = router;
