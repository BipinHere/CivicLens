
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./CitizenLayout.css";

const API = "http://localhost:5000/api/notifications";

function CitizenLayout() {
  const [unread, setUnread] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(API, { credentials: "include" });
        const data = await res.json();

        if (res.ok) {
          setUnread((data.notifications || []).filter(n => !n.is_read).length);
        }
      } catch (error) {
        console.error("Notification count error:", error);
      }
    };

    fetchUnread();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      alert(error.message || "Logout failed");
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <a href="/" className="dashboard-brand">
          ⌖ Civic<span>Lens</span>
        </a>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">▦ Dashboard</NavLink>
          <NavLink to="/complaints">▤ My Complaints</NavLink>
          <NavLink to="/report">＋ Report an Issue</NavLink>
          <NavLink to="/notifications" className="notification-link">
            ♧ Notifications
            {unread > 0 && (
              <span className="notification-badge">{unread}</span>
            )}
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <p>Making every neighbourhood count.</p>
          <button className="sidebar-logout" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

export default CitizenLayout;
