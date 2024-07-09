const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../../utils/verifyToken");

router.post("/login", authController.loginUser);
router.get("/verify", verifyToken, authController.verifyUser);

module.exports = router;
