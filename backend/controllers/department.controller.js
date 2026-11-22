
import pool from "../config/db.js";
import supabase from "../config/supabase.js";
import { randomUUID } from "crypto";
import { createNotification, notifyAdmins } from "../services/notification.service.js";

// Create department
export const createDepartment = async (req, res) => {
  try {
    const { name, description, contact_email } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name required" });

    const result = await pool.query(
      `INSERT INTO departments(name,description,contact_email)
       VALUES($1,$2,$3) RETURNING *`,
      [name.trim(), description || null, contact_email || null]
    );

    res.status(201).json({ success: true, department: result.rows[0] });
  } catch (e) {
    res.status(e.code === "23505" ? 409 : 500).json({ message: "Department creation failed" });
  }
};

// Get departments
export const getDepartments = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM departments ORDER BY name");
    res.json({ success: true, departments: result.rows });
  } catch {
    res.status(500).json({ message: "Could not fetch departments" });
  }
};

// Assign complaint
export const assignComplaint = async (req, res) => {
  const { complaintId, departmentId, assigned_to, notes } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const complaint = await client.query(
      "SELECT user_id,status FROM complaints WHERE id=$1 FOR UPDATE",
      [complaintId]
    );
    if (!complaint.rows.length) throw new Error("Complaint not found");

    const department = await client.query(
      "SELECT id FROM departments WHERE id=$1", [departmentId]
    );
    if (!department.rows.length) throw new Error("Department not found");

    if (assigned_to) {
      const member = await client.query(
        "SELECT 1 FROM department_members WHERE department_id=$1 AND user_id=$2",
        [departmentId, assigned_to]
      );
      if (!member.rows.length) throw new Error("Staff is not in this department");
    }

    const assignment = await client.query(
      `INSERT INTO complaint_assignments
       (complaint_id,department_id,assigned_to,notes)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [complaintId, departmentId, assigned_to || null, notes || null]
    );

    await client.query(
      "UPDATE complaints SET status='assigned',updated_at=NOW() WHERE id=$1",
      [complaintId]
    );

    await client.query(
      `INSERT INTO complaint_updates
       (complaint_id,updated_by,previous_status,new_status,message)
       VALUES($1,$2,$3,'assigned','Complaint assigned to department')`,
      [complaintId, req.user.id, complaint.rows[0].status]
    );

    await createNotification(client, complaint.rows[0].user_id, complaintId,
      "Your complaint has been assigned to a department.");

    if (assigned_to)
      await createNotification(client, assigned_to, complaintId,
        "A new complaint has been assigned to you.");

    await client.query("COMMIT");
    res.status(201).json({ success: true, assignment: assignment.rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e.message);
    res.status(e.message.includes("not found") ? 404 : 400)
      .json({ message: e.message || "Assignment failed" });
  } finally {
    client.release();
  }
};

// Get complaint assignments
export const getComplaintAssignment = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*,d.name AS department_name,u.full_name AS staff_name
       FROM complaint_assignments a
       JOIN departments d ON d.id=a.department_id
       LEFT JOIN users u ON u.id=a.assigned_to
       WHERE a.complaint_id=$1 ORDER BY a.assigned_at DESC`,
      [req.params.complaintId]
    );
    res.json({ success: true, assignments: result.rows });
  } catch {
    res.status(500).json({ message: "Could not fetch assignments" });
  }
};

// Add department staff
export const addDepartmentMember = async (req, res) => {
  try {
    const { department_id, user_id } = req.body;
    const staff = await pool.query(
      "SELECT id FROM users WHERE id=$1 AND role='department_staff'", [user_id]
    );
    if (!staff.rows.length) return res.status(404).json({ message: "Staff not found" });

    const result = await pool.query(
      `INSERT INTO department_members(department_id,user_id)
       VALUES($1,$2) RETURNING *`,
      [department_id, user_id]
    );
    res.status(201).json({ success: true, member: result.rows[0] });
  } catch (e) {
    res.status(e.code === "23505" ? 409 : 500).json({ message: "Could not add staff" });
  }
};

// Get department staff
export const getDepartmentMembers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id,u.full_name,u.email,dm.joined_at
       FROM department_members dm JOIN users u ON u.id=dm.user_id
       WHERE dm.department_id=$1 ORDER BY u.full_name`,
      [req.params.departmentId]
    );
    res.json({ success: true, members: result.rows });
  } catch {
    res.status(500).json({ message: "Could not fetch staff" });
  }
};

// Remove department staff
export const removeDepartmentMember = async (req, res) => {
  try {
    const { departmentId, userId } = req.params;
    const result = await pool.query(
      "DELETE FROM department_members WHERE department_id=$1 AND user_id=$2 RETURNING id",
      [departmentId, userId]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Member not found" });
    res.json({ success: true, message: "Staff removed" });
  } catch {
    res.status(500).json({ message: "Could not remove staff" });
  }
};

// Get staff assignments
export const getAssignedComplaints = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,ST_Y(c.location) AS latitude,ST_X(c.location) AS longitude,
       d.name AS department_name,a.assigned_at,a.notes
       FROM (
         SELECT DISTINCT ON(complaint_id) *
         FROM complaint_assignments ORDER BY complaint_id,assigned_at DESC
       ) a
       JOIN complaints c ON c.id=a.complaint_id
       JOIN departments d ON d.id=a.department_id
       JOIN department_members dm
         ON dm.department_id=a.department_id AND dm.user_id=a.assigned_to
       WHERE a.assigned_to=$1 ORDER BY a.assigned_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, total: result.rows.length, complaints: result.rows });
  } catch {
    res.status(500).json({ message: "Could not fetch assignments" });
  }
};

// Update complaint progress
export const updateAssignedComplaint = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, message } = req.body;
    if (status !== "in_progress")
      return res.status(400).json({ message: "Staff can only start work" });

    await client.query("BEGIN");
    const complaint = await client.query(
      "SELECT status FROM complaints WHERE id=$1 FOR UPDATE", [id]
    );
    if (!complaint.rows.length) throw new Error("Complaint not found");

    const assignment = await client.query(
      `SELECT 1 FROM complaint_assignments a
       JOIN department_members dm
         ON dm.department_id=a.department_id AND dm.user_id=a.assigned_to
       WHERE a.complaint_id=$1 AND a.assigned_to=$2
       ORDER BY a.assigned_at DESC LIMIT 1`,
      [id, req.user.id]
    );
    if (!assignment.rows.length) throw new Error("Complaint not assigned to you");
    if (complaint.rows[0].status !== "assigned")
      throw new Error("Invalid status transition");

    await client.query(
      "UPDATE complaints SET status='in_progress',updated_at=NOW() WHERE id=$1", [id]
    );
    await client.query(
      `INSERT INTO complaint_updates
       (complaint_id,updated_by,previous_status,new_status,message)
       VALUES($1,$2,'assigned','in_progress',$3)`,
      [id, req.user.id, message || null]
    );
    await client.query("COMMIT");
    res.json({ success: true, message: "Work started" });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: e.message || "Progress update failed" });
  } finally {
    client.release();
  }
};

// Submit repair photos
export const submitResolution = async (req, res) => {
  const client = await pool.connect();
  const uploaded = [];

  try {
    const { id } = req.params;
    if (!req.files?.length) return res.status(400).json({ message: "Photos required" });

    await client.query("BEGIN");
    const complaint = await client.query(
      "SELECT status FROM complaints WHERE id=$1 FOR UPDATE", [id]
    );
    if (!complaint.rows.length || complaint.rows[0].status !== "in_progress")
      throw new Error("Complaint is not in progress");

    const assignment = await client.query(
      `SELECT 1 FROM complaint_assignments a
       JOIN department_members dm
         ON dm.department_id=a.department_id AND dm.user_id=a.assigned_to
       WHERE a.complaint_id=$1 AND a.assigned_to=$2
       ORDER BY a.assigned_at DESC LIMIT 1`,
      [id, req.user.id]
    );
    if (!assignment.rows.length) throw new Error("Complaint not assigned to you");

    for (const file of req.files) {
      const path = `${req.user.id}/${randomUUID()}`;
      const { error } = await supabase.storage.from(process.env.SUPABASE_BUCKET)
        .upload(path, file.buffer, { contentType: file.mimetype });
      if (error) throw error;
      uploaded.push(path);

      await client.query(
        `INSERT INTO complaint_images(complaint_id,image_url,image_type)
         VALUES($1,$2,'after')`, [id, path]
      );
    }

    await notifyAdmins(client, id, "Repair evidence submitted. Please verify.");
    await client.query("COMMIT");
    res.status(201).json({ success: true, message: "Photos submitted for verification" });
  } catch (e) {
    await client.query("ROLLBACK");
    if (uploaded.length)
      await supabase.storage.from(process.env.SUPABASE_BUCKET).remove(uploaded);
    res.status(400).json({ message: e.message || "Photo submission failed" });
  } finally {
    client.release();
  }
};

// Get repair evidence
export const getResolutionEvidence = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,image_url,uploaded_at FROM complaint_images
       WHERE complaint_id=$1 AND image_type='after' ORDER BY uploaded_at DESC`,
      [req.params.id]
    );
    const images = await Promise.all(result.rows.map(async (img) => {
      const { data, error } = await supabase.storage.from(process.env.SUPABASE_BUCKET)
        .createSignedUrl(img.image_url, 3600);
      if (error) throw error;
      return { id: img.id, url: data.signedUrl };
    }));
    res.json({ success: true, images });
  } catch {
    res.status(500).json({ message: "Could not fetch evidence" });
  }
};

// Admin verifies repair
export const verifyResolution = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { decision, message } = req.body;
    if (!["approved", "rejected"].includes(decision))
      return res.status(400).json({ message: "Invalid decision" });

    await client.query("BEGIN");
    const complaint = await client.query(
      "SELECT user_id,status FROM complaints WHERE id=$1 FOR UPDATE", [id]
    );
    if (!complaint.rows.length || complaint.rows[0].status !== "in_progress")
      throw new Error("Complaint not awaiting verification");

    const evidence = await client.query(
      "SELECT 1 FROM complaint_images WHERE complaint_id=$1 AND image_type='after' LIMIT 1",
      [id]
    );
    if (!evidence.rows.length) throw new Error("No repair evidence found");

    const status = decision === "approved" ? "resolved" : "in_progress";
    await client.query(
      "UPDATE complaints SET status=$1,updated_at=NOW() WHERE id=$2", [status, id]
    );
    await client.query(
      `INSERT INTO complaint_updates
       (complaint_id,updated_by,previous_status,new_status,message)
       VALUES($1,$2,'in_progress',$3,$4)`,
      [id, req.user.id, status, message || `Resolution ${decision}`]
    );

    await createNotification(
      client, complaint.rows[0].user_id, id,
      decision === "approved"
        ? "Your complaint has been marked as resolved."
        : "Your repair submission was rejected. Further work is required."
    );

    await client.query("COMMIT");
    res.json({ success: true, message: `Resolution ${decision}`, status });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: e.message || "Verification failed" });
  } finally {
    client.release();
  }
};
