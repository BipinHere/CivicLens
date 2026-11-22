
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(form.email, form.password);
      const role = data.user.role;

      if (role === "admin") navigate("/admin");
      else if (role === "department_staff") navigate("/department");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand">
        ⌖ Civic<span>Lens</span>
      </Link>

      <section className="auth-card">
        <span className="auth-label">WELCOME BACK</span>
        <h1>Good to see you again.</h1>
        <p className="auth-description">
          Sign in to report issues and follow the changes in your neighbourhood.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email address</label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        <p className="auth-switch">
          New to CivicLens? <Link to="/register">Create an account</Link>
        </p>
      </section>

      <p className="auth-footer">
        Better cities begin with people who care.
      </p>
    </main>
  );
}

export default Login;
