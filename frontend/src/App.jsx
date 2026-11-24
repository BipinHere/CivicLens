
import { Routes, Route } from "react-router-dom";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

import ProtectedRoute from "./components/common/ProtectedRoute";
import CitizenLayout from "./components/common/CitizenLayout";
import AdminLayout from "./components/common/AdminLayout";

import Dashboard from "./pages/citizen/Dashboard";
import Report from "./pages/citizen/Report";
import MyComplaints from "./pages/citizen/MyComplaints";
import Notifications from "./pages/citizen/Notifications";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AllComplaints from "./pages/admin/AllComplaints";
import ComplaintDetails from "./pages/admin/ComplaintDetails";
import Departments from "./pages/admin/Departments";

import DepartmentDashboard from "./pages/department/DepartmentDashboard";

function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Citizen pages */}
      <Route element={<ProtectedRoute allowedRoles={["citizen"]} />}>
        <Route element={<CitizenLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report" element={<Report />} />
          <Route path="/complaints" element={<MyComplaints />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Route>

      {/* Admin pages */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/complaints" element={<AllComplaints />} />
          <Route path="/admin/complaints/:id" element={<ComplaintDetails />} />
          <Route path="/admin/departments" element={<Departments />} />
        </Route>
      </Route>

      {/* Department staff */}
      <Route element={<ProtectedRoute allowedRoles={["department_staff"]} />}>
        <Route
          path="/department"
          element={<DepartmentDashboard />}
        />
      </Route>

      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;
