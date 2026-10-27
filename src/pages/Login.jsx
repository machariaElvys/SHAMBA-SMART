import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../styles/login.css";

function Login({ onAuthenticated }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.login({ email: email.trim().toLowerCase(), password });
      await onAuthenticated(result.user);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-kicker">Your field journal</p>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to review your crops and irrigation notes.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <div className="auth-error" role="alert">{error}</div> : null}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-link-text">
          New to Shamba-Smart? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
