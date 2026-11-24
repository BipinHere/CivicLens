
import { NavLink, Outlet } from "react-router-dom";
import "./AdminLayout.css";

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          ⌖ Civic<span>Lens</span>
        </a>

        <p className="admin-label">ADMIN WORKSPACE</p>

        <nav className="admin-nav">
          <NavLink to="/admin">▦ Dashboard</NavLink>
          <NavLink to="/admin/complaints">▤ Complaints</NavLink>
          <NavLink to="/admin/departments">▣ Departments</NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <p>Keeping communities accountable.</p>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
