const express = require('express');
const router = express.Router();
const foodController = require('../../controllers/api/foodController');
const upload = require("../../middleware/uploadMiddleware");

router.post("/", upload.single("image"), foodController.createFood);
router.get("/", foodController.getAllFoods);
router.get("/:id", foodController.getFoodById);
router.put("/:id", upload.single("image"), foodController.updateFood);
router.delete("/:id", foodController.deleteFood);

module.exports = router;
