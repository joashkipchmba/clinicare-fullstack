import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { TextField, Button, Box, Typography, Snackbar, Alert } from "@mui/material";

function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editedPatientData, setEditedPatientData] = useState({ name: "", age: "", contact: "", email: "", medical_history: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
    fetchInventory();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/patients/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/appointments/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/inventory/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setInventory(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const handleEditClick = (patient) => {
    setEditingPatient(patient.id);
    setEditedPatientData({ name: patient.name, age: patient.age, contact: patient.contact, email: patient.email, medical_history: patient.medical_history || "" });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedPatientData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleEditSubmit = async (id) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/patients/${id}/`, editedPatientData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setEditingPatient(null);
      setSnackbar({ open: true, message: "Patient record updated successfully!", severity: "success" });
      fetchPatients();
    } catch (error) {
      console.error("Error updating patient record:", error);
      setSnackbar({ open: true, message: "Failed to update patient record", severity: "error" });
    }
  };

  return (
    <div>
      <h2>Doctor Dashboard</h2>

      {/* Patient Records */}
      <div>
        <h3>Patient Records</h3>
        <ul>
          {patients.map((patient) => (
            <li key={patient.id}>
              {editingPatient === patient.id ? (
                <>
                  <TextField name="name" label="Name" value={editedPatientData.name} onChange={handleEditChange} fullWidth sx={{ mb: 1 }} />
                  <TextField name="age" label="Age" type="number" value={editedPatientData.age} onChange={handleEditChange} fullWidth sx={{ mb: 1 }} />
                  <TextField name="contact" label="Contact" value={editedPatientData.contact} onChange={handleEditChange} fullWidth sx={{ mb: 1 }} />
                  <TextField name="email" label="Email" type="email" value={editedPatientData.email} onChange={handleEditChange} fullWidth sx={{ mb: 1 }} />
                  <TextField name="medical_history" label="Medical History" multiline rows={3} value={editedPatientData.medical_history} onChange={handleEditChange} fullWidth sx={{ mb: 1 }} />
                  <Button variant="contained" onClick={() => handleEditSubmit(patient.id)}>Save</Button>
                  <Button variant="outlined" onClick={() => setEditingPatient(null)} sx={{ ml: 1 }}>Cancel</Button>
                </>
              ) : (
                <>
                  {patient.name} - {patient.age} years old - {patient.contact} - {patient.email} - Medical History: {patient.medical_history || "N/A"}
                  <Button variant="text" onClick={() => handleEditClick(patient)} sx={{ ml: 2 }}>Edit</Button>
                </>
              )}
            </li>
          ))}
        </ul>
        <Link to="/patients">View All Patients</Link>
      </div>

      {/* Appointments */}
      <div>
        <h3>Appointments</h3>
        <ul>
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              {appointment.date} - {appointment.patient_name} with {appointment.doctor_name}
            </li>
          ))}
        </ul>
        <Link to="/appointments">View All Appointments</Link>
      </div>

      {/* Inventory */}
      <div>
        <h3>Inventory</h3>
        <ul>
          {inventory.map((item) => (
            <li key={item.id}>
              {item.name} - {item.quantity} in stock
            </li>
          ))}
        </ul>
        <Link to="/inventory">View Inventory</Link>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default DoctorDashboard;
