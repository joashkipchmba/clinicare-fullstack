import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../styles/styles.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);
  const navigate = useNavigate();

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/token/", {
        email,
        password,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { access, refresh } = response.data;
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      const decodedUser = jwtDecode(access);
      console.log("Decoded Token:", decodedUser);

      if (!decodedUser.role) {
        setError("Invalid token. Role not found.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("userRole", decodedUser.role);
      localStorage.setItem("email", decodedUser.email);

      console.log("Logged in as:", decodedUser.email);

      const targetRoute = decodedUser.role === "admin" ? "/admin" :
                         decodedUser.role === "doctor" ? "/doctor-dashboard" :
                         "/dashboard";

      setRedirectTo(targetRoute);
    } catch (err) {
      console.error("Login error:", err);

      let errorMessage = "Invalid credentials. Please try again.";
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = "Incorrect email or password.";
        } else if (err.response.status === 500) {
          errorMessage = "Server error. Try again later.";
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>Clinicare Login</h2>
          <p>Access your healthcare dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span> Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;