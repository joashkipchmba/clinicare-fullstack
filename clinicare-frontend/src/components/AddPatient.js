import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PatientService } from '../utils/api';
import {
  TextField, Button, MenuItem, Box, Typography,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Snackbar, Alert, InputAdornment, IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PhotoCamera, Close } from '@mui/icons-material';
import API from '../utils/api';

const AddPatient = ({ onPatientAdded }) => {
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm();
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const newPatient = await PatientService.create(formData);
      onPatientAdded(newPatient);
      reset();
      setPreviewImage(null);
      setSnackbar({ open: true, message: 'Patient added successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error adding patient:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to add patient',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 800, margin: 'auto', p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>Add New Patient</Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Full Name"
                {...register('name', { required: 'Name is required' })}
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                type="number"
                label="Age"
                {...register('age', {
                  required: 'Age is required',
                  min: { value: 0, message: 'Age must be positive' },
                  max: { value: 120, message: 'Age must be reasonable' }
                })}
                error={!!errors.age}
                helperText={errors.age?.message}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                select
                label="Gender"
                defaultValue=""
                {...register('gender', { required: 'Gender is required' })}
                error={!!errors.gender}
                helperText={errors.gender?.message}
                sx={{ mb: 2 }}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Contact Number"
                {...register('contact', {
                  required: 'Contact is required',
                  pattern: {
                    value: /^[0-9]{10,15}$/,
                    message: 'Invalid phone number'
                  }
                })}
                error={!!errors.contact}
                helperText={errors.contact?.message}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Address"
                {...register('address')}
                sx={{ mb: 2 }}
              />
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Medical History"
            {...register('medical_history')}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Allergies"
            {...register('allergies')}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              sx={{ mr: 2 }}
            >
              Upload Photo
              <input
                type="file"
                hidden
                accept="image/*"
                {...register('photo')}
                onChange={handleImageChange}
              />
            </Button>
            {previewImage && (
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{ height: 60, borderRadius: 4 }}
                />
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                  onClick={() => setPreviewImage(null)}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setOpenDialog(true)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Patient'}
            </Button>
          </Box>
        </form>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Confirm Cancel</DialogTitle>
          <DialogContent>
            Are you sure you want to cancel? All unsaved changes will be lost.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>No, Continue</Button>
            <Button
              onClick={() => {
                reset();
                setPreviewImage(null);
                setOpenDialog(false);
              }}
              color="error"
            >
              Yes, Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AddPatient;