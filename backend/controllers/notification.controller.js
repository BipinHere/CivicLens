
import pool from "../config/db.js";

// Get notifications
export const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not fetch notifications" });
  }
};

// Mark one notification as read
export const markAsRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read=TRUE
       WHERE id=$1 AND user_id=$2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Notification not found" });

    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read=TRUE WHERE user_id=$1",
      [req.user.id]
    );

    res.json({ success: true, message: "All marked as read" });
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id=$1 AND user_id=$2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Notification not found" });

    res.json({ success: true, message: "Notification deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};
