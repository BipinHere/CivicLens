
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./AdminDashboard.css";

const API = "http://localhost:5000/api/complaints";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/stats`, {
        credentials: "include"
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      const recentRes = await fetch(`${API}?limit=5`, {
        credentials: "include"
      });
      const recentData = await recentRes.json();

      if (!recentRes.ok) throw new Error(recentData.message);

      setStats(data.stats);
      setCategories(data.categories || []);
      setRecent(recentData.complaints || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  const cards = [
    ["Total Complaints", stats.total, "dark"],
    ["Submitted", stats.submitted, "orange"],
    ["Pending Review", stats.under_review, "amber"],
    ["In Progress", stats.in_progress, "amber"],
    ["Resolved", stats.resolved, "sage"],
    ["Critical Issues", stats.critical, "red"],
    ["Rejected", stats.rejected, "muted"]
  ];

  const total = Math.max(
    1,
    ...categories.map(item => Number(item.count))
  );

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">OVERVIEW</p>
          <h1>Admin Dashboard</h1>
          <p>Monitor civic complaints across your city.</p>
        </div>
        <button onClick={fetchStats}>Refresh</button>
      </header>

      <section className="admin-stats-grid">
        {cards.map(([label, value, color]) => (
          <div className="admin-stat-card" key={label}>
            <span className={`stat-dot ${color}`} />
            <p>{label}</p>
            <h2>{Number(value || 0).toLocaleString()}</h2>
          </div>
        ))}
      </section>

      <section className="admin-category-section">
        <h2>Complaints by Category</h2>
        <p className="section-description">
          Distribution of reported civic issues.
        </p>

        {categories.length === 0 ? (
          <p>No complaint data available yet.</p>
        ) : categories.map(item => (
          <div className="category-row" key={item.category}>
            <div className="category-info">
              <span>{item.category.replaceAll("_", " ")}</span>
              <strong>{Number(item.count)}</strong>
            </div>

            <div className="category-track">
              <div
                className="category-fill"
                style={{
                  width: `${Number(item.count) / total * 100}%`
                }}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="admin-category-section">
        <h2>Recent Complaints</h2>

        {recent.length === 0 ? (
          <p>No recent complaints.</p>
        ) : recent.map(item => (
          <Link
            to={`/admin/complaints/${item.id}`}
            className="recent-complaint"
            key={item.id}
          >
            <div>
              <strong>{item.title}</strong>
              <small>{item.full_name}</small>
            </div>

            <span>{item.status.replaceAll("_", " ")}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default AdminDashboard;
