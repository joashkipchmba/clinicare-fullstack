import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios"; // Fallback if `../utils/api` is missing
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // ✅ Add userRole & setUserRole
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      try {
        const decoded = jwtDecode(token);

        // Check if the token has expired
        if (decoded.exp * 1000 < Date.now()) {
          console.warn("Token expired, logging out...");
          logout();
        } else {
          setUser({
            id: decoded.user_id,
            email: decoded.email,
          });
          setUserRole(decoded.role || decoded.user_type); // ✅ Set user role
        }
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    }

    setLoading(false);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/api/auth/login/", credentials);
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);

      const decoded = jwtDecode(response.data.access);
      setUser({
        id: decoded.user_id,
        email: decoded.email,
      });
      setUserRole(decoded.role || decoded.user_type); // ✅ Set user role after login

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setUserRole(null); // ✅ Clear role on logout
  };

  return (
    <AuthContext.Provider value={{ user, userRole, setUserRole, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
