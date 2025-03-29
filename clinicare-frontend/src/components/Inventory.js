import React, { useState, useEffect } from 'react';
import { InventoryService } from '../utils/api';
import { Table, Button, TextField, Alert } from '@mui/material';
import '../styles/styles.css';
import API from '../utils/api';

const ManageInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    expiryDate: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await InventoryService.getAll();
        setInventory(data);
      } catch (err) {
        setError('Failed to load inventory');
      }
    };
    fetchInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newItem = await InventoryService.create({
        ...formData,
        quantity: Number(formData.quantity)
      });
      setInventory([...inventory, newItem]);
      setFormData({ name: '', quantity: '', expiryDate: '' });
      setSuccess('Item added successfully');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item');
      setSuccess(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await InventoryService.delete(id);
      setInventory(inventory.filter(item => item.id !== id));
      setSuccess('Item deleted successfully');
      setError(null);
    } catch (err) {
      setError('Failed to delete item');
      setSuccess(null);
    }
  };

  return (
    <div className="inventory-management">
      <h1>Inventory Management</h1>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <div className="inventory-container">
        <div className="inventory-form">
          <h2>Add New Item</h2>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Item Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Expiry Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.expiryDate}
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              fullWidth
              required
              margin="normal"
            />
            <Button type="submit" variant="contained" color="primary">
              Add to Inventory
            </Button>
          </form>
        </div>

        <div className="inventory-list">
          <h2>Current Inventory</h2>
          <Table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(item.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ManageInventory;