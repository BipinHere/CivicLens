
import pool from "../config/db.js";
import supabase from "../config/supabase.js";
import { randomUUID } from "crypto";
import { notifyAdmins } from "../services/notification.service.js";
import { createNotification } from "../services/notification.service.js";

export const createComplaint = async (req, res) => {
  const files = [];

  try {
    const { title, description, category, latitude, longitude, address } = req.body;
    const lat = Number(latitude), lng = Number(longitude);
    const categories = ["pothole", "road_damage", "garbage", "streetlight", "drainage", "open_manhole", "other"];

    if (!title || !categories.includes(category) ||
        latitude == null || longitude == null ||
        !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180)
      return res.status(400).json({ message: "Invalid complaint details" });

    for (const file of req.files || []) {
      const path = `${req.user.id}/${randomUUID()}`;
      const { error } = await supabase.storage.from(process.env.SUPABASE_BUCKET)
        .upload(path, file.buffer, { contentType: file.mimetype });

      if (error) throw error;
      files.push(path);
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO complaints (user_id,title,description,category,location,address)
         VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326),$7)
         RETURNING id,title,category,status,created_at`,
        [req.user.id, title, description || null, category, lng, lat, address || null]
      );

      for (const path of files)
        await client.query(
          "INSERT INTO complaint_images (complaint_id,image_url) VALUES ($1,$2)",
          [result.rows[0].id, path]
        );

        await notifyAdmins(
        client,
        result.rows[0].id,
        `New complaint submitted: ${title}`
      );
      await client.query("COMMIT");
      res.status(201).json({ success: true, complaint: result.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error.message);
    if (files.length)
      await supabase.storage.from(process.env.SUPABASE_BUCKET).remove(files);
    res.status(500).json({ message: "Complaint submission failed" });
  }
};

export const getMyComplaints = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,title,description,category,status,priority,address,created_at,
       ST_Y(location) AS latitude, ST_X(location) AS longitude
       FROM complaints WHERE user_id=$1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    const complaints = await Promise.all(result.rows.map(async (c) => {
      const images = await pool.query(
        "SELECT id,image_url FROM complaint_images WHERE complaint_id=$1",
        [c.id]
      );

      const imageUrls = await Promise.all(images.rows.map(async (img) => {
        const { data, error } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET)
          .createSignedUrl(img.image_url, 3600);

        if (error) throw error;
        return { id: img.id, url: data.signedUrl };
      }));

      return { ...c, images: imageUrls };
    }));

    res.json({ success: true, complaints });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not fetch complaints" });
  }
};

export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === "admin";

    const result = await pool.query(
      `SELECT c.*, ST_Y(c.location) AS latitude,
       ST_X(c.location) AS longitude, u.full_name
       FROM complaints c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 ${isAdmin ? "" : "AND c.user_id = $2"}`,
      isAdmin ? [id] : [id, req.user.id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Complaint not found" });

    const complaint = result.rows[0];

    const images = await pool.query(
      "SELECT id, image_url FROM complaint_images WHERE complaint_id = $1",
      [id]
    );

    complaint.images = await Promise.all(images.rows.map(async img => {
      const { data, error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .createSignedUrl(img.image_url, 3600);

      if (error) throw error;

      return { id: img.id, url: data.signedUrl };
    }));

    const updates = await pool.query(
      `SELECT previous_status, new_status, message, created_at
       FROM complaint_updates
       WHERE complaint_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    complaint.history = updates.rows;

    res.json({ success: true, complaint });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not fetch complaint" });
  }
};

export const updateComplaintStatus = async (req, res) => {
  const { id } = req.params;
  const { status, message } = req.body;
  const allowed = [
    "under_review",
    "assigned",
    "in_progress",
    "resolved",
    "rejected"
  ];

  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "SELECT user_id, status FROM complaints WHERE id=$1 FOR UPDATE",
      [id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Complaint not found" });
    }

    const complaint = result.rows[0];

    await client.query(
      "UPDATE complaints SET status=$1, updated_at=NOW() WHERE id=$2",
      [status, id]
    );

    await client.query(
      `INSERT INTO complaint_updates
       (complaint_id, updated_by, previous_status, new_status, message)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, req.user.id, complaint.status, status, message || null]
    );

    await createNotification(
      client,
      complaint.user_id,
      id,
      `Your complaint status has changed to ${status.replaceAll("_", " ")}.`
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Complaint status updated",
      status
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error.message);
    res.status(500).json({ message: "Status update failed" });
  } finally {
    client.release();
  }
};

export const getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority } = req.query;

    const filters = [];
    const values = [];

    const addFilter = (column, value) => {
      if (value) {
        values.push(value);
        filters.push(`${column} = $${values.length}`);
      }
    };

    addFilter("c.status", status);
    addFilter("c.category", category);
    addFilter("c.priority", priority);

    const where = filters.length
      ? `WHERE ${filters.join(" AND ")}`
      : "";

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT c.id, c.title, c.category, c.status, c.priority,
       c.address, c.created_at, u.full_name,
       ST_Y(c.location) AS latitude,
       ST_X(c.location) AS longitude
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM complaints c ${where}`,
      values
    );

    res.json({
      success: true,
      total: Number(count.rows[0].count),
      page,
      limit,
      complaints: result.rows
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not fetch complaints" });
  }
};

export const getComplaintStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'submitted') AS submitted,
        COUNT(*) FILTER (WHERE status = 'under_review') AS under_review,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        COUNT(*) FILTER (WHERE priority = 'critical') AS critical
      FROM complaints
    `);

    const categories = await pool.query(`
      SELECT category, COUNT(*) AS count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      stats: result.rows[0],
      categories: categories.rows
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not fetch statistics" });
  }
};
