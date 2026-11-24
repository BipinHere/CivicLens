
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AllComplaints.css";

const API = "http://localhost:5000/api/complaints";

function AllComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filters, setFilters] = useState({
    status: "", category: "", priority: ""
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 10;

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page, limit,
          ...Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value)
          )
        });

        const res = await fetch(`${API}?${params}`, {
          credentials: "include"
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setComplaints(data.complaints || []);
        setTotal(Number(data.total || 0));
      } catch (err) {
        setError(err.message || "Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [page, filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const options = {
    status: ["submitted", "under_review", "assigned", "in_progress", "resolved", "rejected"],
    category: ["pothole", "road_damage", "garbage", "streetlight", "drainage", "open_manhole", "other"],
    priority: ["critical", "high", "medium", "low"]
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="all-complaints">
      <header className="complaints-header">
        <div>
          <p className="admin-eyebrow">MANAGEMENT</p>
          <h1>All Complaints</h1>
          <p>Review and monitor civic issues.</p>
        </div>
        <span className="complaint-count">{total} Reports</span>
      </header>

      <section className="complaint-filters">
        {Object.entries(options).map(([key, values]) => (
          <select
            key={key}
            value={filters[key]}
            onChange={e => updateFilter(key, e.target.value)}
          >
            <option value="">All {key}s</option>
            {values.map(value => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        ))}

        <button onClick={() => {
          setFilters({ status: "", category: "", priority: "" });
          setPage(1);
        }}>
          Reset Filters
        </button>
      </section>

      <section className="complaints-table-card">
        {loading ? <p className="table-message">Loading...</p> :
         error ? <p className="table-message error">{error}</p> :
         !complaints.length ? <p className="table-message">No complaints found.</p> :
         <div className="table-scroll">
          <table className="admin-complaints-table">
            <thead>
              <tr>
                {["Issue", "Citizen", "Category", "Priority", "Status", "Date"].map(h =>
                  <th key={h}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {complaints.map(item => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/admin/complaints/${item.id}`} className="complaint-title-link">
                      <strong>{item.title}</strong>
                    </Link>
                    <small>{item.address || "No address"}</small>
                  </td>
                  <td>{item.full_name || "Unknown"}</td>
                  <td className="capitalize">{item.category?.replaceAll("_", " ")}</td>
                  <td><span className={`priority-tag ${item.priority}`}>{item.priority || "N/A"}</span></td>
                  <td><span className={`status-tag ${item.status}`}>{item.status?.replaceAll("_", " ")}</span></td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
         </div>
        }

        <div className="complaints-pagination">
          <span>Page {page} of {Math.max(1, totalPages)}</span>
          <div>
            <button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button disabled={page >= totalPages || loading || !total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AllComplaints;
