
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./ComplaintDetails.css";

const API = "http://localhost:5000/api/complaints";
const DEPT_API = "http://localhost:5000/api/departments";

function ComplaintDetails() {
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [evidence, setEvidence] = useState([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const res = await fetch(`${API}/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Complaint not found");

        setComplaint(data.complaint);
        setNewStatus(data.complaint.status);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  useEffect(() => {
    fetch(DEPT_API, { credentials: "include" })
      .then(res => res.json())
      .then(data => setDepartments(data.departments || []))
      .catch(err => setError(err.message));
  }, []);

  // Fetch repair evidence
  useEffect(() => {
    if (complaint?.status !== "in_progress") {
      setEvidence([]);
      return;
    }

    fetch(`${DEPT_API}/${id}/resolution`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setEvidence(data.images || []))
      .catch(console.error);
  }, [id, complaint?.status]);

  const handleDepartmentChange = async (value) => {
    setDepartmentId(value);
    setStaffId("");
    setMembers([]);
    if (!value) return;

    try {
      setLoadingMembers(true);
      const res = await fetch(`${DEPT_API}/${value}/members`, {
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not load staff");
      setMembers(data.members || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingMembers(false);
    }
  };

  const assignComplaint = async () => {
    if (!departmentId || !staffId) return alert("Select department and staff.");

    try {
      setAssigning(true);
      const res = await fetch(`${DEPT_API}/assign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: id, departmentId, assigned_to: staffId, notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Assignment failed");

      setComplaint(prev => ({ ...prev, status: "assigned" }));
      setNewStatus("assigned");
      setStaffId("");
      setNotes("");
      alert("Complaint assigned successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const updateStatus = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`${API}/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setComplaint(prev => ({
        ...prev,
        status: newStatus,
        history: [{
          previous_status: prev.status,
          new_status: newStatus,
          message: data.message,
          created_at: new Date().toISOString()
        }, ...(prev.history || [])]
      }));

      alert("Status updated successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Approve or reject repair
  const verifyResolution = async (decision) => {
    try {
      setVerifying(true);
      const res = await fetch(`${DEPT_API}/${id}/verify`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, message: reviewMessage })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      setComplaint(prev => ({ ...prev, status: data.status }));
      setNewStatus(data.status);
      setEvidence([]);
      setReviewMessage("");
      alert(data.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <p>Loading complaint...</p>;
  if (error) return <p className="details-error">{error}</p>;
  if (!complaint) return <p>Complaint not found.</p>;

  const images = complaint.images || [];
  const statuses = [
    "submitted", "under_review", "assigned",
    "in_progress", "resolved", "rejected"
  ];

  return (
    <div className="complaint-details">
      <Link to="/admin/complaints" className="back-link">
        ← Back to Complaints
      </Link>

      <header className="details-header">
        <div>
          <p className="admin-eyebrow">COMPLAINT DETAILS</p>
          <h1>{complaint.title}</h1>
          <p>Reported on {new Date(complaint.created_at).toLocaleString()}</p>
        </div>
        <span className={`status-tag ${complaint.status}`}>
          {complaint.status.replaceAll("_", " ")}
        </span>
      </header>

      <div className="details-grid">
        <section className="details-card">
          <h2>Issue Information</h2>
          {[
            ["Category", complaint.category || "N/A"],
            ["Priority", complaint.priority || "Not assigned"],
            ["Address", complaint.address || "Not provided"],
            ["Citizen", complaint.full_name || "Unknown"]
          ].map(([label, value]) => (
            <div className="detail-row" key={label}>
              <span>{label}</span>
              <strong>{String(value).replaceAll("_", " ")}</strong>
            </div>
          ))}
          <h3>Description</h3>
          <p className="details-description">
            {complaint.description || "No description provided."}
          </p>
        </section>

        <section className="details-card">
          <h2>AI Analysis</h2>
          {[
            ["Detected Category", complaint.ai_category || "Not available"],
            ["AI Confidence", complaint.ai_confidence != null
              ? `${(Number(complaint.ai_confidence) * 100).toFixed(1)}%`
              : "Not available"],
            ["AI Severity", complaint.ai_severity || "Not available"]
          ].map(([label, value]) => (
            <div className="detail-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <p className="ai-note">AI results are advisory. Admin verification is required.</p>
        </section>
      </div>

      {/* Assignment */}
      <section className="details-card">
        <h2>Assign to Department</h2>
        {["resolved", "rejected"].includes(complaint.status) ? (
          <p>This complaint is already closed.</p>
        ) : (
          <>
            <div className="status-controls">
              <select value={departmentId} onChange={e => handleDepartmentChange(e.target.value)}>
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>

              <select value={staffId} onChange={e => setStaffId(e.target.value)}
                disabled={!departmentId || loadingMembers}>
                <option value="">{loadingMembers ? "Loading staff..." : "Select Staff"}</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} ({member.email})
                  </option>
                ))}
              </select>
            </div>

            <textarea placeholder="Assignment notes (optional)" value={notes}
              onChange={e => setNotes(e.target.value)} rows={3} />

            <button onClick={assignComplaint} disabled={assigning || !departmentId || !staffId}>
              {assigning ? "Assigning..." : "Assign Complaint"}
            </button>

            {departments.length === 0 && <p>No departments available. Create one first.</p>}
            {departmentId && !loadingMembers && members.length === 0 &&
              <p>No staff members in this department yet.</p>}
          </>
        )}
      </section>

      {/* Resolution Verification */}
      {complaint.status === "in_progress" && (
        <section className="details-card">
          <h2>Resolution Verification</h2>

          {evidence.length === 0 ? (
            <p>No repair photos submitted yet.</p>
          ) : (
            <>
              <div className="details-images">
                {evidence.map(img => (
                  <a href={img.url} target="_blank" rel="noreferrer" key={img.id}>
                    <img src={img.url} alt="Repair evidence" />
                  </a>
                ))}
              </div>

              <textarea
                placeholder="Feedback for department staff..."
                value={reviewMessage}
                onChange={e => setReviewMessage(e.target.value)}
                rows={3}
              />

              <button disabled={verifying} onClick={() => verifyResolution("approved")}>
                {verifying ? "Processing..." : "Approve Resolution"}
              </button>

              <button disabled={verifying} onClick={() => verifyResolution("rejected")}>
                Reject Resolution
              </button>
            </>
          )}
        </section>
      )}

      {/* Status */}
      <section className="details-card">
        <h2>Manage Complaint Status</h2>
        <div className="status-controls">
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            {statuses.map(status => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </select>
          <button onClick={updateStatus} disabled={updating || newStatus === complaint.status}>
            {updating ? "Updating..." : "Update Status"}
          </button>
        </div>
      </section>

      {/* Reported Images */}
      <section className="details-card images-section">
        <h2>Reported Images</h2>
        {images.length ? (
          <div className="details-images">
            {images.map(image => (
              <a href={image.url} target="_blank" rel="noreferrer" key={image.id}>
                <img src={image.url} alt="Complaint evidence" />
              </a>
            ))}
          </div>
        ) : <p>No images uploaded.</p>}
      </section>

      {/* History */}
      <section className="details-card history-section">
        <h2>Status History</h2>
        {!complaint.history?.length ? <p>No status updates yet.</p> : (
          <div className="history-list">
            {complaint.history.map((item, index) => (
              <div className="history-item" key={index}>
                <div className="history-dot" />
                <div>
                  <strong>
                    {item.previous_status?.replaceAll("_", " ")}
                    {" → "}
                    {item.new_status.replaceAll("_", " ")}
                  </strong>
                  <p>{item.message || "Status updated."}</p>
                  <small>{new Date(item.created_at).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ComplaintDetails;
