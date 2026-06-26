const express = require("express");
console.log("Admin Routes Loaded");
const { registerAdmin, loginAdmin } = require("../controllers/admin.controller");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

module.exports = router;