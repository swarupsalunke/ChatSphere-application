import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import toast, { Toaster } from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, MessageCircle } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating your account...");

    try {
      await API.post("/api/user/register", form);
      toast.success("Account created! Please login.", { id: toastId });
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#233138",
            color: "#e9edef",
            border: "1px solid #2a3942",
            fontSize: "14px",
            fontFamily: "'DM Sans', sans-serif",
          },
          success: { iconTheme: { primary: "#25d366", secondary: "#fff" } },
        }}
      />

      <div className="auth-page">
        {/* Background blobs */}
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />

        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <MessageCircle size={30} />
            </div>
            <span className="auth-logo-text">ChatApp</span>
          </div>

          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join and start chatting instantly</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="auth-field">
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <User size={17} />
                </span>
                <input
                  className="auth-input"
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            </div>





            {/* Phone */}
            <div className="auth-field">
  <div className="auth-input-wrap">
    <input
      className="auth-input"
      type="tel"
      name="phone"
      placeholder="Mobile Number"
      value={form.phone}
      onChange={handleChange}
      maxLength={10}
      autoComplete="tel"
    />
  </div>
</div>




            {/* Email */}
            <div className="auth-field">
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <Mail size={17} />
                </span>
                <input
                  className="auth-input"
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <Lock size={17} />
                </span>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password (min 6 chars)"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`auth-submit-btn ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;