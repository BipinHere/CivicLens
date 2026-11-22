
import express from "express";
import upload from "../middleware/upload.middleware.js";

import {
  createDepartment,
  getDepartments,
  assignComplaint,
  getComplaintAssignment,
  addDepartmentMember,
  getDepartmentMembers,
  removeDepartmentMember,
  getAssignedComplaints,
  updateAssignedComplaint,
  submitResolution,
  getResolutionEvidence,
  verifyResolution
} from "../controllers/department.controller.js";

import {
  authMiddleware,
  authorizeRoles
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorizeRoles("admin"), createDepartment);
router.get("/", authorizeRoles("admin"), getDepartments);

router.post("/assign", authorizeRoles("admin"), assignComplaint);
router.get("/assignments/:complaintId", authorizeRoles("admin"), getComplaintAssignment);

router.post("/members", authorizeRoles("admin"), addDepartmentMember);
router.get("/:departmentId/members", authorizeRoles("admin"), getDepartmentMembers);
router.delete("/:departmentId/members/:userId", authorizeRoles("admin"), removeDepartmentMember);

router.get("/assigned", authorizeRoles("department_staff"), getAssignedComplaints);
router.put("/:id/progress", authorizeRoles("department_staff"), updateAssignedComplaint);

router.post(
  "/:id/resolution",
  authorizeRoles("department_staff"),
  upload.array("images", 5),
  submitResolution
);

router.get("/:id/resolution", authorizeRoles("admin"), getResolutionEvidence);
router.patch("/:id/verify", authorizeRoles("admin"), verifyResolution);

export default router;
