const express = require("express");
const router = express.Router();
const subscriptionController = require("../../controllers/api/subscriptionController");
const { authenticateAndAuthorize } = require("../../middleware/authMiddleware");

router.post(
  "/",
  authenticateAndAuthorize("admin", "manager", "delivery"),
  subscriptionController.subscription
);

router.post(
  "/unsubscribe",
  authenticateAndAuthorize("admin", "manager", "delivery"),
  subscriptionController.unsubscribe
);

module.exports = router;
