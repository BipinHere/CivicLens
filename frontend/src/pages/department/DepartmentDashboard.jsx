
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./DepartmentDashboard.css";

const API = "http://localhost:5000/api/departments";

function DepartmentDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/assigned`, {
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not load complaints");

      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const startWork = async (id) => {
    try {
      setBusy(id);

      const res = await fetch(`${API}/${id}/progress`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in_progress",
          message: "Department staff started working on this complaint."
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not start work");

      await fetchComplaints();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy("");
    }
  };

  const submitResolution = async (id) => {
    const selectedFiles = files[id];

    if (!selectedFiles?.length) {
      alert("Please select at least one repair photo.");
      return;
    }

    try {
      setBusy(id);

      const formData = new FormData();
      Array.from(selectedFiles).forEach(file => {
        formData.append("images", file);
      });

      const res = await fetch(`${API}/${id}/resolution`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      alert("Repair photos submitted for admin verification.");
      setFiles(prev => ({ ...prev, [id]: null }));
      await fetchComplaints();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy("");
    }
  };

  const assigned = complaints.filter(c => c.status === "assigned").length;
  const inProgress = complaints.filter(c => c.status === "in_progress").length;

  return (
    <div className="department-dashboard">
      <header className="staff-header">
        <div>
          <p className="admin-eyebrow">DEPARTMENT WORKSPACE</p>
          <h1>Staff Dashboard</h1>
          <p>Manage your assigned civic complaints.</p>
        </div>

        <div className="staff-header-actions">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={fetchComplaints}>Refresh</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section className="staff-stats">
        <article>
          <span>Total Assigned</span>
          <strong>{complaints.length}</strong>
        </article>
        <article>
          <span>Awaiting Work</span>
          <strong>{assigned}</strong>
        </article>
        <article>
          <span>In Progress</span>
          <strong>{inProgress}</strong>
        </article>
      </section>

      <section className="staff-complaints">
        <h2>My Assigned Complaints</h2>

        {loading ? (
          <p>Loading complaints...</p>
        ) : error ? (
          <p className="staff-error">{error}</p>
        ) : complaints.length === 0 ? (
          <p>No complaints have been assigned to you yet.</p>
        ) : (
          <div className="staff-complaint-list">
            {complaints.map(complaint => (
              <article className="staff-complaint-card" key={complaint.id}>
                <div className="staff-card-heading">
                  <div>
                    <p className="staff-department-name">
                      {complaint.department_name}
                    </p>
                    <h3>{complaint.title}</h3>
                  </div>

                  <span className={`status-tag ${complaint.status}`}>
                    {complaint.status.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="staff-description">
                  {complaint.description || "No description provided."}
                </p>

                <div className="staff-details">
                  <span>
                    Category: {complaint.category?.replaceAll("_", " ") || "N/A"}
                  </span>
                  <span>Priority: {complaint.priority || "N/A"}</span>
                  <span>Location: {complaint.address || "Not provided"}</span>
                </div>

                {complaint.notes && (
                  <p className="staff-notes">
                    Admin notes: {complaint.notes}
                  </p>
                )}

                {complaint.status === "assigned" && (
                  <button
                    disabled={busy === complaint.id}
                    onClick={() => startWork(complaint.id)}
                  >
                    {busy === complaint.id ? "Starting..." : "Start Work"}
                  </button>
                )}

                {complaint.status === "in_progress" && (
                  <div className="resolution-upload">
                    <label>Upload after-repair photos</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => setFiles(prev => ({
                        ...prev,
                        [complaint.id]: e.target.files
                      }))}
                    />

                    <button
                      disabled={busy === complaint.id}
                      onClick={() => submitResolution(complaint.id)}
                    >
                      {busy === complaint.id
                        ? "Submitting..."
                        : "Submit for Verification"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default DepartmentDashboard;
