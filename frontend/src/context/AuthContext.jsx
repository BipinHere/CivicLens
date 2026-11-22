
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const API = "http://localhost:5000/api/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing login session
  useEffect(() => {
    fetch(`${API}/me`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Register user
  const register = async (details) => {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(details)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    setUser(data.user);
    return data;
  };

  // Login user
  const login = async (email, password) => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    setUser(data.user);
    return data;
  };

  // Logout user
  const logout = async () => {
    const res = await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Logout failed");

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
