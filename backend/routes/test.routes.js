
import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/protected", authMiddleware, (req, res) => {
    res.json({ success: true, user: req.user });
});

router.get("/admin", authMiddleware, authorizeRoles("admin"), (req, res) => {
    res.json({ success: true, message: "Admin access granted" });
});

export default router;
