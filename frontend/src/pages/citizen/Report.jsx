
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Report.css";

const API = "http://localhost:5000/api/complaints";

function Report() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    address: "",
    latitude: "",
    longitude: ""
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(prev => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude
        }));
        setError("");
      },
      () => setError("Unable to access your location. Allow location permission.")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });

      if (image) data.append("images", image);

      const res = await fetch(API, {
        method: "POST",
        credentials: "include",
        body: data
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to submit complaint");
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <span className="section-label">CITIZEN WORKSPACE</span>
        <h1>Report an issue.</h1>
        <p>Help make your neighbourhood safer and better.</p>
      </div>

      <form className="report-form" onSubmit={handleSubmit}>
        <label>Complaint title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Large pothole near main road"
          required
        />

        <label>Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        >
          <option value="">Select a category</option>
          <option value="pothole">Pothole</option>
          <option value="road_damage">Road Damage</option>
          <option value="garbage">Garbage</option>
          <option value="streetlight">Streetlight</option>
          <option value="drainage">Drainage</option>
          <option value="open_manhole">Open Manhole</option>
          <option value="other">Other</option>
        </select>

        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the problem in detail..."
          rows="5"
          required
        />

        <label>Location / Address</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Enter the issue location"
          required
        />

        <button type="button" className="location-button" onClick={getLocation}>
          ⌖ Detect my location
        </button>

        {form.latitude && (
          <p className="location-success">
            Location captured: {form.latitude}, {form.longitude}
          </p>
        )}

        <label>Upload an image</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files[0] || null)}
        />

        {image && <p className="location-success">{image.name}</p>}

        {error && <p className="report-error">{error}</p>}

        <button className="submit-report" disabled={loading}>
          {loading ? "Submitting..." : "Submit complaint ↗"}
        </button>
      </form>
    </div>
  );
}

export default Report;
