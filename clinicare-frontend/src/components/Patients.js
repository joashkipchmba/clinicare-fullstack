import React, { useState, useEffect } from 'react';
import { PatientService } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { DataGrid } from '@mui/x-data-grid';
import AddPatient from './AddPatient';
import { Button, Box, Typography } from '@mui/material';
import API from '../utils/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'age', headerName: 'Age', width: 80 },
    { field: 'gender', headerName: 'Gender', width: 100 },
    { field: 'contact', headerName: 'Contact', width: 150 },
    ...(user?.role === 'doctor'
      ? [{ field: 'medical_history', headerName: 'Medical History', width: 200 }]
      : []),
  ];

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await PatientService.getAll();
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleAddPatient = (newPatient) => {
    setPatients([...patients, newPatient]);
    setShowForm(false);
  };

  return (
    <Box sx={{ height: 600, width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Patients</Typography>
        <Button
          variant="contained"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hide Form' : 'Add Patient'}
        </Button>
      </Box>

      {showForm && <AddPatient onPatientAdded={handleAddPatient} />}

      <DataGrid
        rows={patients}
        columns={columns}
        loading={loading}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        disableSelectionOnClick
      />
    </Box>
  );
};

export default Patients;