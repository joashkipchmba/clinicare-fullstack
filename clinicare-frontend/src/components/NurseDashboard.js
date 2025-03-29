import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function NurseDashboard() {
  const [patients, setPatients] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    fetchPatients();
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

  return (
    <div>
      <h2>Nurse Dashboard</h2>

      {/* Patient Records */}
      <div>
        <h3>Patient Records</h3>
        <ul>
          {patients.map((patient) => (
            <li key={patient.id}>
              {patient.name} - {patient.age} years old
            </li>
          ))}
        </ul>
        <Link to="/patients">View All Patients</Link>
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
    </div>
  );
}

export default NurseDashboard;
