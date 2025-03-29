import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const isAdmin = () => {
  const token = localStorage.getItem("accessToken");

  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    return decoded.role === "admin";
  } catch (error) {
    return false;
  }
};

const AdminRoute = () => {
  return isAdmin() ? <Outlet /> : <Navigate to="/dashboard" />;
};

export default AdminRoute;