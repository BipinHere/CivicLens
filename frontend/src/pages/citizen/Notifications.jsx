
import { useEffect, useState } from "react";
import "./Notifications.css";

const API = "http://localhost:5000/api/notifications";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      const res = await fetch(API, { credentials: "include" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      const res = await fetch(`${API}/${id}/read`, {
        method: "PUT",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Could not update notification");

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch(`${API}/read-all`, {
        method: "PUT",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Could not update notifications");

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Could not delete notification");

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading notifications...</p>;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <p className="eyebrow">STAY UPDATED</p>
          <h1>Notifications</h1>
          <p>Your latest complaint updates and alerts.</p>
        </div>

        <button onClick={markAllRead}>
          Mark all as read
        </button>
      </div>

      {error && <p className="notification-error">{error}</p>}

      {notifications.length === 0 ? (
        <div className="empty-notifications">
          <h3>You're all caught up!</h3>
          <p>New updates will appear here.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map(notification => (
            <div
              className={`notification-card ${notification.is_read ? "read" : "unread"}`}
              key={notification.id}
            >
              <div className="notification-content">
                <span className="notification-dot" />
                <div>
                  <p>{notification.message}</p>
                  <small>
                    {new Date(notification.created_at).toLocaleString()}
                  </small>
                </div>
              </div>

              <div className="notification-actions">
                {!notification.is_read && (
                  <button onClick={() => markRead(notification.id)}>
                    Mark read
                  </button>
                )}

                <button
                  className="delete-notification"
                  onClick={() => deleteNotification(notification.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
