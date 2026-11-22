import express from "express";
import { createComplaint,
    getMyComplaints,
    getComplaintById,
    updateComplaintStatus,
    getAllComplaints,
    getComplaintStats,
 } from "../controllers/complaint.controller.js";
import { authMiddleware,authorizeRoles } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", upload.array("images", 5), createComplaint);
router.get("/my", getMyComplaints);
router.get("/", authorizeRoles("admin"), getAllComplaints);
router.get("/stats", authorizeRoles("admin"), getComplaintStats);
router.get("/:id", getComplaintById);
router.put(
  "/:id/status",
  authorizeRoles("admin", "department_staff"),
  updateComplaintStatus
);

export default router;