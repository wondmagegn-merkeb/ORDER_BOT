const { Admin } = require("../../models/index");
const { Op } = require("sequelize");
const webpush = require("web-push");

const vapidEmail = process.env.VAPID_EMAIL
  ? process.env.VAPID_EMAIL.startsWith("mailto:")
    ? process.env.VAPID_EMAIL
    : `mailto:${process.env.VAPID_EMAIL}`
  : "mailto:your_email@example.com";

webpush.setVapidDetails(
  vapidEmail,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.subscription = async (req, res) => {
  const { endpoint, expirationTime, keys } = req.body;
  try {
    const adminId = req.admin.adminId;

    // Check if admin exists
    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Check if endpoint is already used by another admin
    const otherAdminWithEndpoint = await Admin.findOne({
      where: {
        endpoint,
        adminId: { [Op.ne]: adminId },
      },
    });

    if (otherAdminWithEndpoint) {
      return res.status(400).json({
        message:
          "This device (endpoint) is already linked to another admin account.",
      });
    }

    // Save/update subscription
    admin.endpoint = endpoint;
    admin.expirationTime = expirationTime;
    admin.keys = keys;
    await admin.save();

    // Build push subscription object
    const subscription = {
      endpoint,
      expirationTime,
      keys,
    };

    // Send test notification
    const payload = JSON.stringify({
      title: "Subscription Confirmed",
      body: "You will now receive notifications on this device!",
    });

    await webpush.sendNotification(subscription, payload);

    return res.status(200).json({
      message: "Subscription successful and test notification sent!",
      admin,
    });
  } catch (err) {
    if (err.statusCode === 410) {
      return res
        .status(410)
        .json({ message: "Subscription expired or no longer valid." });
    }

    res.status(500).json({
      message:
        "An error occurred while saving your subscription. Please try again later.",
    });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const adminId = req.admin.adminId;

    // Check if admin exists
    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Clear subscription data
    admin.endpoint = null;
    admin.expirationTime = null;
    admin.keys = null;
    await admin.save();

    return res.status(200).json({
      message: "Successfully unsubscribed from notifications",
    });
  } catch (err) {
    res.status(500).json({
      message: "An error occurred while unsubscribing. Please try again later.",
    });
  }
};
