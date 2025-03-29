import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./components/AdminDashboard";
import DoctorDashboard from "./components/DoctorDashboard";
import NurseDashboard from "./components/NurseDashboard";
import StaffDashboard from "./components/StaffDashboard";
import ManageUsers from "./components/ManageUsers";
import ManageInventory from "./components/ManageInventory";
import Reports from "./components/Reports";
import Patients from "./components/Patients";
import AddPatient from "./components/AddPatient";
import Appointments from "./components/Appointments";
import Inventory from "./components/Inventory";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { userRole, setUserRole } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role || decoded.user_type);
        console.log("Current userRole:", decoded.role || decoded.user_type); // Debugging log
      } catch (error) {
        console.error("Invalid token", error);
        localStorage.removeItem("accessToken");
        setUserRole(null);
      }
    }
  }, [setUserRole]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            userRole === "admin" ? (
              <Navigate to="/admin" replace />
            ) : userRole === "doctor" ? (
              <Navigate to="/doctor-dashboard" replace />
            ) : userRole === "nurse" ? (
              (console.log("Redirecting to nurse-dashboard"), <Navigate to="/nurse-dashboard" replace />)
            ) : userRole === "staff" ? (
              <Navigate to="/staff-dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/nurse-dashboard" element={<NurseDashboard />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/patients" element={<Patients isDoctor={userRole === "doctor"} />} />
          <Route path="/patients/add" element={<AddPatient />} />
          <Route path="/appointments" element={<Appointments isDoctor={userRole === "doctor"} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/inventory" element={<ManageInventory />} />
            <Route path="/admin/reports" element={<Reports adminView />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 