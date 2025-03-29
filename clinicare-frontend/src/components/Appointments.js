import React, { useState, useEffect } from 'react';
import {
  Calendar, momentLocalizer, Views
} from 'react-big-calendar';
import moment from 'moment-timezone';
import {
  Button, Modal, Box, Typography, TextField,
  MenuItem, Dialog, DialogActions, DialogContent,
  DialogTitle, Snackbar, Alert, Chip, Tooltip,
  IconButton, LinearProgress, Paper, Tabs, Tab
} from '@mui/material';
import {
  Add, Delete, Edit, Close,
  Person, MedicalServices, Today
} from '@mui/icons-material';
import {
  AppointmentService, PatientService, UserService
} from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import 'react-big-calendar/lib/sass/styles.scss';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import API from '../utils/api';

const localizer = momentLocalizer(moment);

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    patient: '',
    doctor: user.role === 'doctor' ? user.id : '',
    date: new Date(),
    time: new Date(),
    duration: 30,
    reason: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = appointments.filter(appt => {
      const matchesSearch =
        appt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appt.doctor && `${appt.doctor.first_name} ${appt.doctor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
        appt.reason.toLowerCase().includes(searchTerm.toLowerCase());

      if (user.role === 'doctor') {
        return matchesSearch && appt.doctor?.id === user.id;
      }
      return matchesSearch;
    });
    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptsData, doctorsData, patientsData] = await Promise.all([
        AppointmentService.getAll(),
        UserService.getAll({ role: 'doctor' }),
        PatientService.getAll()
      ]);

      const formattedAppts = apptsData.map(appt => ({
        ...appt,
        id: appt.id,
        title: `${appt.patient_name} - ${appt.reason}`,
        start: new Date(`${appt.date}T${appt.time}`),
        end: moment(`${appt.date}T${appt.time}`).add(appt.duration, 'minutes').toDate(),
      }));

      setAppointments(formattedAppts);
      setDoctors(doctorsData);
      setPatients(patientsData);
      setError(null);
    } catch (err) {
      setError('Failed to load appointments. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setFormData({
      patient: event.patient_id || '',
      doctor: event.doctor?.id || '',
      date: new Date(event.start),
      time: new Date(event.start),
      duration: moment(event.end).diff(moment(event.start), 'minutes'),
      reason: event.reason || '',
      status: event.status || 'scheduled'
    });
    setSelectedAppointment(event.id);
  };

  const handleSelectSlot = (slotInfo) => {
    setSelectedAppointment(null);
    setSelectedEvent(null);
    setFormData({
      patient: '',
      doctor: user.role === 'doctor' ? user.id : '',
      date: slotInfo.start,
      time: slotInfo.start,
      duration: 30,
      reason: '',
      status: 'scheduled'
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    try {
      const appointmentData = {
        patient_id: formData.patient,
        doctor_id: formData.doctor,
        date: moment(formData.date).format('YYYY-MM-DD'),
        time: moment(formData.time).format('HH:mm'),
        duration: formData.duration,
        reason: formData.reason,
        status: formData.status
      };

      if (selectedAppointment) {
        await AppointmentService.update(selectedAppointment, appointmentData);
        setSuccess('Appointment updated successfully');
      } else {
        await AppointmentService.create(appointmentData);
        setSuccess('Appointment created successfully');
      }

      fetchData();
      setOpenModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save appointment');
    }
  };

  const handleDelete = async () => {
    try {
      await AppointmentService.delete(selectedAppointment);
      setSuccess('Appointment deleted successfully');
      setOpenDeleteDialog(false);
      fetchData();
    } catch (err) {
      setError('Failed to delete appointment');
    }
  };

  const handleViewChange = (view) => {
    setView(view);
  };

  const handleDateChange = (date) => {
    setDate(date);
  };

  const getEventStyle = (event) => {
    let backgroundColor = '';
    switch (event.status) {
      case 'completed':
        backgroundColor = '#4caf50';
        break;
      case 'cancelled':
        backgroundColor = '#f44336';
        break;
      case 'no-show':
        backgroundColor = '#ff9800';
        break;
      default:
        backgroundColor = '#2196f3';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const renderEvent = (event) => {
    return (
      <Tooltip title={`${event.patient_name} with ${event.doctor ? `Dr. ${event.doctor.last_name}` : 'No doctor'} - ${event.reason}`}>
        <div>
          <strong>{event.patient_name}</strong>
          <div>{event.reason}</div>
          <div>{moment(event.start).format('h:mm a')}</div>
        </div>
      </Tooltip>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, height: 'calc(100vh - 64px)' }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h4">Appointments</Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

                        <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenModal(true)}
            >
              New Appointment
            </Button>
          </Box>
        </Box>

        {loading && <LinearProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {success && (
          <Snackbar open autoHideDuration={3000} onClose={() => setSuccess(null)}>
            <Alert severity="success">{success}</Alert>
          </Snackbar>
        )}

        <Paper elevation={3} sx={{ p: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Calendar View" />
            <Tab label="List View" />
          </Tabs>

          {tabValue === 0 && (
            <Calendar
              localizer={localizer}
              events={filteredAppointments}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'week', 'day']}
              defaultView={view}
              date={date}
              onNavigate={handleDateChange}
              onView={handleViewChange}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              style={{ height: 600, marginTop: 20 }}
              eventPropGetter={getEventStyle}
              components={{ event: renderEvent }}
            />
          )}

          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              {filteredAppointments.length === 0 ? (
                <Typography>No appointments found.</Typography>
              ) : (
                filteredAppointments.map((appt) => (
                  <Paper key={appt.id} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{appt.patient_name}</Typography>
                      <Typography variant="body2">{appt.reason}</Typography>
                      <Typography variant="body2">{moment(appt.start).format('MMM D, YYYY h:mm A')}</Typography>
                    </Box>
                    <Box>
                      <Chip label={appt.status} color={appt.status === 'completed' ? 'success' : appt.status === 'cancelled' ? 'error' : 'primary'} />
                      <IconButton onClick={() => handleSelectEvent(appt)}><Edit /></IconButton>
                      <IconButton onClick={() => { setSelectedAppointment(appt.id); setOpenDeleteDialog(true); }}><Delete /></IconButton>
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          )}
        </Paper>

        {/* Appointment Modal */}
        <Modal open={openModal} onClose={() => setOpenModal(false)}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 3, borderRadius: 2
          }}>
            <Typography variant="h6" gutterBottom>
              {selectedAppointment ? 'Edit Appointment' : 'New Appointment'}
            </Typography>
            <TextField
              fullWidth margin="normal" label="Reason"
              value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
            <TextField
              select fullWidth margin="normal" label="Patient"
              value={formData.patient} onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            >
              {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField
              select fullWidth margin="normal" label="Doctor"
              value={formData.doctor} onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              disabled={user.role === 'doctor'}
            >
              {doctors.map((d) => <MenuItem key={d.id} value={d.id}>{d.first_name} {d.last_name}</MenuItem>)}
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date" value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                renderInput={(params) => <TextField fullWidth margin="normal" {...params} />}
              />
              <TimePicker
                label="Time" value={formData.time}
                onChange={(time) => setFormData({ ...formData, time })}
                renderInput={(params) => <TextField fullWidth margin="normal" {...params} />}
              />
            </LocalizationProvider>
            <DialogActions>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained">Save</Button>
            </DialogActions>
          </Box>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this appointment?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Appointments;
