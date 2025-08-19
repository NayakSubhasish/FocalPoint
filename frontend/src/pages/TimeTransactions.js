import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, IconButton, Autocomplete } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Close as CloseIcon, Edit as EditIcon, Delete as DeleteIcon, Download as DownloadIcon } from '@mui/icons-material';
import Papa from 'papaparse';

const TimeTransactions = () => {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ taskId: '', date: '', hours: '', transactions: '', transactionType: '', fileName: '', userId: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [dateFilters, setDateFilters] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  // Export current entries to CSV
  const handleExportCsv = () => {
    if (!entries.length) {
      setSnackbar({ open: true, message: 'No entries to export' });
      return;
    }

    // Helper function to escape CSV values and handle special characters
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headers = ['Employee','Project','Task','File Name','Date','Hours','Transactions','Type'];
    const csvRows = [headers.join(',')];

    entries.forEach((e) => {
      const row = [
        escapeCsvValue(e.user?.name || ''),
        escapeCsvValue(e.task?.Project?.name || ''),
        escapeCsvValue(e.task?.title || ''),
        escapeCsvValue(e.fileName || ''),
        escapeCsvValue(e.date),
        escapeCsvValue(e.hours),
        escapeCsvValue(e.transactions),
        escapeCsvValue(e.transactionType || '')
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    // Add BOM for proper UTF-8 encoding
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with date range if filters are applied
    let filename = `time_entries_${new Date().toISOString().split('T')[0]}`;
    if (dateFilters.startDate && dateFilters.endDate) {
      filename += `_${dateFilters.startDate}_to_${dateFilters.endDate}`;
    } else if (dateFilters.startDate) {
      filename += `_from_${dateFilters.startDate}`;
    } else if (dateFilters.endDate) {
      filename += `_to_${dateFilters.endDate}`;
    }
    filename += '.csv';
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        setLoading(true);
        let url = `${process.env.REACT_APP_API_URL}/time-transactions`;
        const params = new URLSearchParams();
        
        if (dateFilters.startDate) {
          params.append('startDate', dateFilters.startDate);
        }
        if (dateFilters.endDate) {
          params.append('endDate', dateFilters.endDate);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) throw new Error('Failed to fetch entries');
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: 'Failed to fetch entries' });
      } finally {
        setLoading(false);
      }
    };
    // fetch users for admin/pm
    const fetchUsers = async () => {
      if (user.role === 'admin' || user.role === 'project_manager') {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/users`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          if (!res.ok) throw new Error('Failed to fetch users');
          const data = await res.json();
          setUsers(data);
        } catch (err) { console.error(err); }
      }
    };
    fetchTasks();
    fetchEntries();
    fetchUsers();
  }, [user, dateFilters]);

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
      fileName: entry.fileName || '',
      userId: entry.user?.id || '',
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
        body: JSON.stringify({ ...form, userId: (user.role === 'admin' || user.role === 'project_manager') ? form.userId : undefined }),
      });
      console.log('Response status:', res.status, 'OK:', res.ok);
      if (!res.ok) throw new Error('Failed to save entry');
      const data = await res.json();
      console.log('Response data:', data);
      // Update entries list
      setEntries((prev) => [data, ...prev.filter((e) => e.id !== data.id)]);
      setForm({ taskId: '', date: '', hours: '', transactions: '', transactionType: '', fileName: '', userId: '' });
      setEditingId(null);
      setSnackbar({ open: true, message: 'Entry saved' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err.message });
    }
  };

  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g,''),
      dynamicTyping: {
        hours: true,
        transactions: true,
      },
      complete: async (results) => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${process.env.REACT_APP_API_URL}/time-transactions/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ entries: results.data }),
          });
          if (!res.ok) throw new Error('Bulk import failed');
          const { imported } = await res.json();
          setSnackbar({ open: true, message: `${imported} entries imported` });
          // refresh list
          const refreshed = await fetch(`${process.env.REACT_APP_API_URL}/time-transactions`, { headers: { Authorization: token } });
          const data = await refreshed.json();
          setEntries(data);
        } catch (err) {
          console.error(err);
          setSnackbar({ open: true, message: err.message });
        }
      },
      error: (err) => {
        console.error(err);
        setSnackbar({ open: true, message: 'CSV parse error' });
      }
    });
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Time & Transactions</Typography>
      
      {/* Date Range Filters */}
      <Box display="flex" gap={2} flexWrap="wrap" mb={3} alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
          Date Range Filter:
        </Typography>
        <TextField
          label="Start Date"
          type="date"
          size="small"
          value={dateFilters.startDate}
          onChange={(e) => setDateFilters({ ...dateFilters, startDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="End Date"
          type="date"
          size="small"
          value={dateFilters.endDate}
          onChange={(e) => setDateFilters({ ...dateFilters, endDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => setDateFilters({ startDate: '', endDate: '' })}
        >
          Clear Filters
        </Button>
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setDateFilters({ 
              startDate: firstDay.toISOString().split('T')[0], 
              endDate: today.toISOString().split('T')[0] 
            });
          }}
        >
          This Month
        </Button>
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => {
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            setDateFilters({ 
              startDate: lastMonth.toISOString().split('T')[0], 
              endDate: lastMonthEnd.toISOString().split('T')[0] 
            });
          }}
        >
          Last Month
        </Button>
        {loading && <Typography variant="body2" color="textSecondary">Loading...</Typography>}
      </Box>
      
      {/* Summary Statistics */}
      {entries.length > 0 && (
        <Box display="flex" gap={3} mb={3} flexWrap="wrap">
          <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="h6">{entries.length.toLocaleString()}</Typography>
            <Typography variant="body2">Total Entries</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="h6">
              {entries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0).toFixed(2)}
            </Typography>
            <Typography variant="body2">Total Hours</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'info.light', color: 'white', borderRadius: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="h6">
              {entries.reduce((sum, entry) => sum + (parseInt(entry.transactions) || 0), 0).toLocaleString()}
            </Typography>
            <Typography variant="body2">Total Transactions</Typography>
          </Box>
          {(dateFilters.startDate || dateFilters.endDate) && (
            <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'white', borderRadius: 1, minWidth: 200 }}>
              <Typography variant="body2">
                {dateFilters.startDate && dateFilters.endDate 
                  ? `Filtered: ${dateFilters.startDate} to ${dateFilters.endDate}`
                  : dateFilters.startDate 
                    ? `From: ${dateFilters.startDate}`
                    : `To: ${dateFilters.endDate}`
                }
              </Typography>
            </Box>
          )}
        </Box>
      )}
      
      <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
        {(user.role === 'admin' || user.role === 'project_manager') && (
          <Autocomplete
            size="small"
            sx={{ minWidth: 180 }}
            options={users}
            getOptionLabel={(option) => option.name}
            value={users.find(u => u.id === form.userId) || null}
            onChange={(event, newValue) => {
              setForm({ ...form, userId: newValue ? newValue.id : '' });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Employee"
                placeholder="Search for employee..."
              />
            )}
          />
        )}
        <Autocomplete
          size="small"
          sx={{ minWidth: 240 }}
          options={tasks}
          getOptionLabel={(option) => `${option.title} (${option.Project?.name || 'No Project'})`}
          value={tasks.find(t => t.id === form.taskId) || null}
          onChange={(event, newValue) => {
            setForm({ ...form, taskId: newValue ? newValue.id : '' });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Task"
              placeholder="Search for task..."
            />
          )}
        />
        <TextField name="date" label="Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={form.date} onChange={handleChange} />
        <TextField name="hours" label="Hours" type="number" size="small" value={form.hours} onChange={handleChange} />
        <TextField name="fileName" label="File Name / Description" size="small" value={form.fileName} onChange={handleChange} />
        <TextField name="transactions" label="Transactions" type="number" size="small" value={form.transactions} onChange={handleChange} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select name="transactionType" value={form.transactionType} label="Type" onChange={handleChange}>
            <MenuItem value="pages">Pages</MenuItem>
            <MenuItem value="images">Images</MenuItem>
            <MenuItem value="records">Records</MenuItem>
            <MenuItem value="charts">Charts</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSubmit}>{editingId ? 'Update' : 'Save'}</Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv}>Export CSV</Button>
        <Button variant="contained" component="label">Import CSV
          <input type="file" accept=".csv" hidden onChange={handleCsvImport} />
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {(user.role === 'admin' || user.role === 'project_manager' || user.role === 'team_leader') && <TableCell>Employee</TableCell>}
              <TableCell>Project</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Date</TableCell><TableCell>Task</TableCell><TableCell>Hours</TableCell><TableCell>Transactions</TableCell><TableCell>Type</TableCell><TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                {(user.role === 'admin' || user.role === 'project_manager' || user.role === 'team_leader') && <TableCell>{e.user?.name}</TableCell>}
                <TableCell>{e.task?.Project?.name}</TableCell>
                <TableCell>{e.fileName}</TableCell>
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