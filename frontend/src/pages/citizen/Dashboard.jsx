
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

const API = "http://localhost:5000/api/complaints";

function Dashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await fetch(`${API}/my`, {
          credentials: "include"
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setComplaints(data.complaints || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const stats = [
    { label: "Total Reports", value: complaints.length },
    {
      label: "Pending",
      value: complaints.filter(c =>
        ["submitted", "under_review", "assigned"].includes(c.status)
      ).length
    },
    {
      label: "In Progress",
      value: complaints.filter(c => c.status === "in_progress").length
    },
    {
      label: "Resolved",
      value: complaints.filter(c => c.status === "resolved").length
    }
  ];

  const formatStatus = status =>
    status?.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      <header className="dashboard-header">
        <div>
          <span className="section-label">CITIZEN WORKSPACE</span>
          <h1>Good day, {user?.full_name?.split(" ")[0] || "Citizen"}.</h1>
          <p>Here's what's happening in your neighbourhood.</p>
        </div>

        <div className="user-avatar">
          {user?.full_name?.charAt(0)?.toUpperCase() || "C"}
        </div>
      </header>

      <section className="dashboard-welcome">
        <div>
          <span>YOUR VOICE MATTERS</span>
          <h2>Better streets start<br />with a simple report.</h2>
          <p>Spotted something that needs fixing? Let your city know.</p>
          <a href="/report" className="dashboard-cta">
            Report an issue ↗
          </a>
        </div>
        <div className="welcome-symbol">⌖</div>
      </section>

      <section className="dashboard-stats">
        {stats.map(stat => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <h2>{loading ? "—" : stat.value}</h2>
          </article>
        ))}
      </section>

      <section className="recent-section">
        <div>
          <div>
            <span className="section-label">YOUR ACTIVITY</span>
            <h2>Recent complaints</h2>
          </div>
          <a href="/complaints">View all ↗</a>
        </div>

        {loading ? (
          <div className="empty-complaints">Loading complaints...</div>
        ) : error ? (
          <div className="empty-complaints">{error}</div>
        ) : complaints.length === 0 ? (
          <div className="empty-complaints">
            <span>▤</span>
            <h3>No reports yet</h3>
            <p>Your submitted civic complaints will appear here.</p>
          </div>
        ) : (
          <div className="complaint-list">
            {complaints.slice(0, 5).map(complaint => (
              <article className="complaint-item" key={complaint.id}>
                <div>
                  <h3>{complaint.title}</h3>
                  <p>
                    {complaint.category} · {complaint.address || "Location unavailable"}
                  </p>
                  <small>
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </small>
                </div>

                <span className={`complaint-status ${complaint.status}`}>
                  {formatStatus(complaint.status)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default Dashboard;
