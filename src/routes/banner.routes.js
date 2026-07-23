const express = require("express");
const { getBanners } = require("../controllers/banner.controller");

const router = express.Router();

// Get active banners list (Public)
router.get("/", getBanners);

module.exports = router;
