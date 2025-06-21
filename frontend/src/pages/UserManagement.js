import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
  Alert,
  Chip,
  DialogContentText,
  FormControlLabel,
  Checkbox,
  TablePagination,
  TableSortLabel,
  Skeleton,
} from '@mui/material';
import { Add, Edit, Delete, Visibility, VisibilityOff, Refresh } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const roles = [
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'team_member', label: 'Team Member' },
  { value: 'team_leader', label: 'Team Leader' },
];

const UserManagement = () => {
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'team_member',
    changePassword: false 
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to fetch users');
      }
      
      const data = await res.json();
      console.log('Fetched users:', data);
      setUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpen = (userToEdit = null) => {
    setError('');
    setSuccess('');
    if (userToEdit) {
      setForm({ 
        name: userToEdit.name, 
        email: userToEdit.email, 
        password: '', 
        role: userToEdit.role,
        changePassword: false 
      });
      setEditId(userToEdit.id);
    } else {
      setForm({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'team_member',
        changePassword: false 
      });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm({ 
      name: '', 
      email: '', 
      password: '', 
      role: 'team_member',
      changePassword: false 
    });
    setEditId(null);
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    // Validation
    if (!form.name || !form.email) {
      setError('Name and email are required');
      return;
    }
    
    if (!editId && !form.password) {
      setError('Password is required for new users');
      return;
    }
    
    if (editId && form.changePassword && !form.password) {
      setError('Password is required when changing password');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const method = editId ? 'PUT' : 'POST';
      const url = `${process.env.REACT_APP_API_URL}/users${editId ? `/${editId}` : ''}`;
      
      const requestBody = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      
      // Only include password if it's a new user or if changing password for existing user
      if (!editId || (editId && form.changePassword && form.password)) {
        requestBody.password = form.password;
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save user');
      }
      
      setSuccess(editId ? 'User updated successfully!' : 'User created successfully!');
      setTimeout(() => {
        handleClose();
        fetchUsers();
      }, 1500);
    } catch (err) {
      setError(err.message);
      console.error('Submit error:', err);
    }
  };

  const handleDeleteClick = (userToDelete) => {
    setUserToDelete(userToDelete);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete user');
      }
      
      setSuccess('User deleted successfully!');
      setDeleteOpen(false);
      setUserToDelete(null);
      fetchUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Delete error:', err);
      setDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteOpen(false);
    setUserToDelete(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'project_manager': return 'primary';
      case 'team_member': return 'default';
      case 'team_leader': return 'info';
      default: return 'default';
    }
  };

  const canDeleteUser = (userToCheck) => {
    return userToCheck.role !== 'admin' && userToCheck.id !== user.id;
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setPage(0);
  };

  const handleSort = (prop) => {
    const isAsc = orderBy === prop && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(prop);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  function descendingComparator(a, b, prop) {
    if (b[prop] < a[prop]) return -1;
    if (b[prop] > a[prop]) return 1;
    return 0;
  }

  function getComparator(ord, prop) {
    return ord === 'desc' ? (a, b) => descendingComparator(a, b, prop) : (a, b) => -descendingComparator(a, b, prop);
  }

  function stableSort(array, comparator) {
    const stabilized = array.map((el, idx) => [el, idx]);
    stabilized.sort((a, b) => {
      const orderRes = comparator(a[0], b[0]);
      if (orderRes !== 0) return orderRes;
      return a[1] - b[1];
    });
    return stabilized.map(el => el[0]);
  }

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>User Management</Typography>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <TextField size="small" variant="outlined" placeholder="Search Users" value={searchText} onChange={handleSearchChange} />
        <Box>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchUsers} sx={{ mr: 1 }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Add User
          </Button>
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === 'name' ? order : false}>
                <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => handleSort('name')}>Name</TableSortLabel>
              </TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingUsers
              ? Array.from({ length: rowsPerPage }).map((_, idx) => (
                  <TableRow key={idx}>
                    {[...Array(5)].map((__, c) => <TableCell key={c}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
              : stableSort(
                  users.filter(u => u.name.toLowerCase().includes(searchText.toLowerCase()) || u.email.toLowerCase().includes(searchText.toLowerCase())),
                  getComparator(order, orderBy)
                )
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={u.role.replace('_', ' ')} 
                    color={getRoleColor(u.role)}
                    size="small"
                    clickable={false}
                    onClick={() => {}}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={u.isActive !== false ? 'Active' : 'Inactive'} 
                    color={u.isActive !== false ? 'success' : 'default'}
                    size="small"
                    clickable={false}
                    onClick={() => {}}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpen(u)} size="small">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  {canDeleteUser(u) && (
                    <Tooltip title="Delete">
                      <IconButton 
                        onClick={() => handleDeleteClick(u)} 
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
                  ))
            }
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={users.filter(u => u.name.toLowerCase().includes(searchText.toLowerCase()) || u.email.toLowerCase().includes(searchText.toLowerCase())).length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            margin="normal"
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            required
            disabled={!!editId}
          />
          
          {editId && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.changePassword}
                  onChange={handleChange}
                  name="changePassword"
                />
              }
              label="Change Password"
              sx={{ mt: 1, mb: 1 }}
            />
          )}
          
          {(!editId || form.changePassword) && (
            <TextField
              margin="normal"
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              fullWidth
              required={!editId || form.changePassword}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
          )}
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              name="role"
              value={form.role}
              label="Role"
              onChange={handleChange}
            >
              {roles.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editId ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 