import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function StaffDashboard() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, []);

  // Fetch Patients
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

  // Fetch Appointments
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

  return (
    <div>
      <h2>Staff (Receptionist) Dashboard</h2>

      {/* Manage Patients */}
      <div>
        <h3>Manage Patients</h3>
        <Link to="/patients/add">
          <button>Add New Patient</button>
        </Link>
        <ul>
          {patients.map((patient) => (
            <li key={patient.id}>
              {patient.name} - {patient.age} years old
              <Link to={`/patients/edit/${patient.id}`}>
                <button>Edit</button>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Manage Appointments */}
      <div>
        <h3>Manage Appointments</h3>
        <Link to="/appointments/add">
          <button>Add New Appointment</button>
        </Link>
        <ul>
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              {appointment.date} - {appointment.patient_name}
              <Link to={`/appointments/edit/${appointment.id}`}>
                <button>Edit</button>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default StaffDashboard;
