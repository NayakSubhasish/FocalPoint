import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Close as CloseIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const TimeTransactions = () => {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ taskId: '', date: '', hours: '', transactions: '', transactionType: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    // fetch tasks for selection
    const fetchTasks = async () => {
      try {
        const endpoint = user.role === 'team_member'
          ? `${process.env.REACT_APP_API_URL}/tasks/my-tasks`
          : `${process.env.REACT_APP_API_URL}/tasks`;
        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error(err);
      }
    };
    // fetch entries
    const fetchEntries = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/time-transactions`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) throw new Error('Failed to fetch entries');
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTasks();
    fetchEntries();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle edit button click
  const handleEdit = (entry) => {
    setForm({
      taskId: entry.taskId,
      date: entry.date,
      hours: entry.hours,
      transactions: entry.transactions,
      transactionType: entry.transactionType,
    });
    setEditingId(entry.id);
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/time-transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete entry');
      setEntries(entries.filter((e) => e.id !== id));
      setSnackbar({ open: true, message: 'Entry deleted' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err.message });
    }
  };

  const handleSubmit = async () => {
    console.log('Submitting TimeEntry:', form);
    if (!form.taskId) return setSnackbar({ open: true, message: 'Please select a task.' });
    try {
      const url = editingId
        ? `${process.env.REACT_APP_API_URL}/time-transactions/${editingId}`
        : `${process.env.REACT_APP_API_URL}/time-transactions`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ...form }),
      });
      console.log('Response status:', res.status, 'OK:', res.ok);
      if (!res.ok) throw new Error('Failed to save entry');
      const data = await res.json();
      console.log('Response data:', data);
      // Update entries list
      setEntries((prev) => [data, ...prev.filter((e) => e.id !== data.id)]);
      setForm({ taskId: '', date: '', hours: '', transactions: '', transactionType: '' });
      setEditingId(null);
      setSnackbar({ open: true, message: 'Entry saved' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err.message });
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Time & Transactions</Typography>
      <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Task</InputLabel>
          <Select name="taskId" value={form.taskId} label="Task" onChange={handleChange}>
            <MenuItem value=""><em>Select task</em></MenuItem>
            {tasks.map(t => (<MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>))}
          </Select>
        </FormControl>
        <TextField name="date" label="Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={form.date} onChange={handleChange} />
        <TextField name="hours" label="Hours" type="number" size="small" value={form.hours} onChange={handleChange} />
        <TextField name="transactions" label="Transactions" type="number" size="small" value={form.transactions} onChange={handleChange} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select name="transactionType" value={form.transactionType} label="Type" onChange={handleChange}>
            <MenuItem value="pages">Pages</MenuItem>
            <MenuItem value="images">Images</MenuItem>
            <MenuItem value="records">Records</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSubmit}>{editingId ? 'Update' : 'Save'}</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell><TableCell>Task</TableCell><TableCell>Hours</TableCell><TableCell>Transactions</TableCell><TableCell>Type</TableCell><TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.date}</TableCell>
                <TableCell>{e.task?.title}</TableCell>
                <TableCell>{e.hours}</TableCell>
                <TableCell>{e.transactions}</TableCell>
                <TableCell>{e.transactionType}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(e)}><EditIcon /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(e.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        message={snackbar.message}
        action={
          <IconButton size="small" onClick={() => setSnackbar({ ...snackbar, open: false })}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default TimeTransactions; 