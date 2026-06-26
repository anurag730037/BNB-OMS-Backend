const express = require("express");
const { createArea, getAllAreas } = require("../controllers/area.controller");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", protect, authorizeRoles("admin"), createArea);
router.get("/all", protect, getAllAreas);
router.put("/edit/:id", protect, authorizeRoles("admin"), editArea);

module.exports = router;
