
import { useEffect, useState } from "react";
import "./Departments.css";

const API = "http://localhost:5000/api/departments";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    contact_email: ""
  });
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const request = async (url, options = {}) => {
    const res = await fetch(`${API}${url}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await request("");
      setDepartments(data.departments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const createDepartment = async (e) => {
    e.preventDefault();

    try {
      await request("", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setForm({ name: "", description: "", contact_email: "" });
      fetchDepartments();
      alert("Department created successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  const viewMembers = async (department) => {
    try {
      const data = await request(`/${department.id}/members`);
      setSelected(department);
      setMembers(data.members || []);
      setUserId("");
    } catch (err) {
      alert(err.message);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();

    try {
      await request("/members", {
        method: "POST",
        body: JSON.stringify({
          department_id: selected.id,
          user_id: userId.trim()
        })
      });

      setUserId("");
      viewMembers(selected);
      alert("Staff member added!");
    } catch (err) {
      alert(err.message);
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm("Remove this staff member?")) return;

    try {
      await request(`/${selected.id}/members/${memberId}`, {
        method: "DELETE"
      });

      setMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="departments-page">
      <header className="departments-header">
        <div>
          <p className="admin-eyebrow">ADMIN WORKSPACE</p>
          <h1>Departments</h1>
          <p>Manage civic departments and their staff.</p>
        </div>
        <span>{departments.length} Departments</span>
      </header>

      <section className="department-create">
        <h2>Create Department</h2>

        <form onSubmit={createDepartment}>
          <input
            placeholder="Department name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            placeholder="Contact email"
            type="email"
            value={form.contact_email}
            onChange={e => setForm({ ...form, contact_email: e.target.value })}
          />

          <textarea
            placeholder="Department description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />

          <button type="submit">Create Department</button>
        </form>
      </section>

      <section className="department-list">
        <h2>All Departments</h2>

        {loading ? (
          <p>Loading departments...</p>
        ) : error ? (
          <p className="department-error">{error}</p>
        ) : departments.length === 0 ? (
          <p>No departments created yet.</p>
        ) : (
          <div className="department-grid">
            {departments.map(department => (
              <article className="department-card" key={department.id}>
                <div>
                  <h3>{department.name}</h3>
                  <p>{department.description || "No description available."}</p>
                  <small>{department.contact_email || "No contact email"}</small>
                </div>

                <button onClick={() => viewMembers(department)}>
                  Manage Staff
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <section className="department-members">
          <div className="members-heading">
            <div>
              <p className="admin-eyebrow">STAFF MANAGEMENT</p>
              <h2>{selected.name}</h2>
            </div>

            <button className="close-members" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>

          <form className="add-member-form" onSubmit={addMember}>
            <input
              placeholder="Enter department staff user ID"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              required
            />
            <button type="submit">Add Staff</button>
          </form>

          <h3>Department Members ({members.length})</h3>

          {members.length === 0 ? (
            <p>No staff members assigned yet.</p>
          ) : (
            <div className="members-list">
              {members.map(member => (
                <div className="member-row" key={member.id}>
                  <div>
                    <strong>{member.full_name}</strong>
                    <p>{member.email}</p>
                  </div>

                  <button onClick={() => removeMember(member.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Departments;
