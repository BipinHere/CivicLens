
import { useEffect, useState } from "react";
import "./MyComplaints.css";

const API = "http://localhost:5000/api/complaints";

function MyComplaints() {
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

        if (!res.ok) {
          throw new Error(data.message || "Unable to load complaints");
        }

        setComplaints(data.complaints || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const formatStatus = status =>
    status?.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <main className="my-complaints">
      <header>
        <span className="section-label">CITIZEN WORKSPACE</span>
        <h1>My complaints.</h1>
        <p>Track the progress of issues you've reported.</p>
      </header>

      <div className="complaints-summary">
        <span>Total submitted</span>
        <strong>{loading ? "—" : complaints.length}</strong>
      </div>

      {loading ? (
        <p className="complaints-message">Loading your complaints...</p>
      ) : error ? (
        <p className="complaints-message error">{error}</p>
      ) : complaints.length === 0 ? (
        <div className="complaints-empty">
          <h3>No complaints found</h3>
          <p>Your submitted reports will appear here.</p>
          <a href="/report">Report an issue ↗</a>
        </div>
      ) : (
        <div className="all-complaints">
          {complaints.map(complaint => (
            <article className="all-complaint-card" key={complaint.id}>
              <div>
                <span className="complaint-category">
                  {complaint.category?.replaceAll("_", " ")}
                </span>
                <h3>{complaint.title}</h3>
                <p>{complaint.address || "Location unavailable"}</p>
                <small>
                  Submitted: {new Date(complaint.created_at).toLocaleDateString()}
                </small>
              </div>

              <span className={`complaint-status ${complaint.status}`}>
                {formatStatus(complaint.status)}
              </span>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyComplaints;
