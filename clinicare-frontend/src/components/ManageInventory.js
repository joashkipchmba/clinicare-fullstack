import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, TextField,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Snackbar, Alert, IconButton, Tooltip, Pagination,
  Chip, LinearProgress, Box, Typography, Menu, MenuItem
} from '@mui/material';
import {
  Add, Delete, Edit, Search, FilterList,
  Inventory, Warning, CheckCircle
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import API from '../utils/api';

const ManageInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState('all');
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    threshold: '',
    supplier: '',
    expiryDate: null,
    cost: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (Array.isArray(inventory)) {
      const filtered = inventory.filter(item => {
  const name = item.name ? item.name.toLowerCase() : "";
  const category = item.category ? item.category.toLowerCase() : "";

  const matchesSearch =
    name.includes(searchTerm.toLowerCase()) ||
    category.includes(searchTerm.toLowerCase());

  if (filter === "low") return matchesSearch && item.quantity <= item.threshold;
  if (filter === "expired") return matchesSearch && new Date(item.expiryDate) < new Date();
  if (filter === "soon") {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 30);
    return matchesSearch && new Date(item.expiryDate) < soonDate && new Date(item.expiryDate) >= new Date();
  }
  return matchesSearch;
});
      setFilteredInventory(filtered);
      setPage(1);
    }
  }, [inventory, searchTerm, filter]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await API.get('/inventory/');
      if (Array.isArray(response.data)) {
        setInventory(response.data);
      } else {
        console.error('Invalid API response:', response.data);
        setInventory([]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load inventory. Please try again.');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await API.put(`/inventory/${currentItem.id}/`, formData);
        setSuccess('Item updated successfully');
      } else {
        await API.post('/inventory/', formData);
        setSuccess('Item added successfully');
      }
      fetchInventory();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/inventory/${id}/`);
      setSuccess('Item deleted successfully');
      fetchInventory();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {loading ? (
          <LinearProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.threshold}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>${parseFloat(item.cost).toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDelete(item.id)}>
                        <Delete color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
          <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ManageInventory;
