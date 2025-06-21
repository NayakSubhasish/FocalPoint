import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  DialogContentText,
  TablePagination,
  TableSortLabel,
  Skeleton,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ProjectManagement = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    billingMethod: 'hourly',
    estimatedHours: '',
    estimatedTransactions: '',
    managerId: '',
    status: 'planning',
    teamLeaderId: '',
    teamMemberIds: [],
  });

  useEffect(() => {
    if (user) {
      fetchProjects();
      if (user.role !== 'team_member') {
        fetchUsers();
      }
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpen = (project = null) => {
    setError('');
    setSuccess('');
    if (project) {
      // Determine team leader and member IDs from the association
      const leader = project.teamMembers?.find((tm) => tm.ProjectTeam.role === 'lead');
      const members = project.teamMembers
        ?.filter((tm) => tm.ProjectTeam.role === 'member')
        .map((tm) => tm.id);
      setFormData({
        name: project.name,
        description: project.description,
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        billingMethod: project.billingMethod || 'hourly',
        estimatedHours: project.estimatedHours || '',
        estimatedTransactions: project.estimatedTransactions || '',
        managerId: project.managerId || '',
        status: project.status || 'planning',
        teamLeaderId: leader?.id || '',
        teamMemberIds: members || [],
      });
      setEditId(project.id);
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        billingMethod: 'hourly',
        estimatedHours: '',
        estimatedTransactions: '',
        managerId: '',
        status: 'planning',
        teamLeaderId: '',
        teamMemberIds: [],
      });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name || !formData.description) {
      setError('Name and description are required');
      return;
    }

    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId 
        ? `${process.env.REACT_APP_API_URL}/projects/${editId}`
        : `${process.env.REACT_APP_API_URL}/projects`;
      console.log(`Submitting project ${method} to ${url}`, formData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          estimatedHours: parseInt(formData.estimatedHours) || 0,
          estimatedTransactions: parseInt(formData.estimatedTransactions) || 0,
          managerId: formData.managerId || null,
          teamLeaderId: formData.teamLeaderId || null,
          teamMemberIds: formData.teamMemberIds || [],
        }),
      });
      console.log(`Response status: ${response.status} ok: ${response.ok}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editId ? 'update' : 'create'} project`);
      }
      const data = await response.json();
      console.log('Project response data:', data);
      
      setSuccess(editId ? 'Project updated successfully!' : 'Project created successfully!');
      setTimeout(() => {
        handleClose();
        fetchProjects();
      }, 1500);
    } catch (error) {
      console.error(`Error ${editId ? 'updating' : 'creating'} project:`, error);
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setSuccess('');
    setEditId(null);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      billingMethod: 'hourly',
      estimatedHours: '',
      estimatedTransactions: '',
      managerId: '',
      status: 'planning',
      teamLeaderId: '',
      teamMemberIds: [],
    });
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete project');
      }
      
      setSuccess('Project deleted successfully!');
      setDeleteOpen(false);
      setProjectToDelete(null);
      fetchProjects();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.message);
      setDeleteOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteOpen(false);
    setProjectToDelete(null);
  };

  const getBillingMethodColor = (method) => {
    switch (method) {
      case 'hourly': return 'primary';
      case 'fixed': return 'success';
      case 'per_transaction': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
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
  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };
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
    return ord === 'desc'
      ? (a, b) => descendingComparator(a, b, prop)
      : (a, b) => -descendingComparator(a, b, prop);
  }
  function stableSort(array, comparator) {
    const stabilized = array.map((el, idx) => [el, idx]);
    stabilized.sort((a, b) => {
      const orderRes = comparator(a[0], b[0]);
      if (orderRes !== 0) return orderRes;
      return a[1] - b[1];
    });
    return stabilized.map((el) => el[0]);
  }

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Project Management</Typography>
      <Box mb={2} display="flex" justifyContent="flex-end">
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search Projects"
          value={searchText}
          onChange={handleSearchChange}
        />
      </Box>
      {user.role !== 'team_member' && (
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpen()} 
          sx={{ mb: 2 }}
        >
          Add New Project
        </Button>
      )}
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === 'name' ? order : false}>
                <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => handleSort('name')}>Name</TableSortLabel>
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Billing Method</TableCell>
              <TableCell>Est. Hours</TableCell>
              <TableCell>Est. Transactions</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Team Leader</TableCell>
              <TableCell>Team Members</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingProjects
              ? Array.from({ length: rowsPerPage }).map((_, idx) => (
                  <TableRow key={idx}>
                    {[...Array(10)].map((__, c) => <TableCell key={c}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
              : stableSort(
                  projects.filter((p) => p.name.toLowerCase().includes(searchText.toLowerCase())),
                  getComparator(order, orderBy)
                )
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.description}</TableCell>
                      <TableCell>{project.startDate ? formatDate(project.startDate) : 'N/A'}</TableCell>
                      <TableCell>{project.endDate ? formatDate(project.endDate) : 'N/A'}</TableCell>
                      <TableCell>{project.billingMethod}</TableCell>
                      <TableCell>{project.estimatedHours}</TableCell>
                      <TableCell>{project.estimatedTransactions}</TableCell>
                      <TableCell>{project.manager?.name || 'Unassigned'}</TableCell>
                      <TableCell>{project.teamMembers?.find(tm => tm.ProjectTeam.role === 'lead')?.name || '—'}</TableCell>
                      <TableCell>{project.teamMembers?.filter(tm => tm.ProjectTeam.role === 'member').map(tm => tm.name).join(', ') || '—'}</TableCell>
                      <TableCell><Chip label={project.status} color={getBillingMethodColor(project.billingMethod)} /></TableCell>
                      <TableCell>
                        {user.role !== 'team_member' && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton onClick={() => handleOpen(project)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton onClick={() => handleDeleteClick(project)}>
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
            }
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={projects.filter((p) => p.name.toLowerCase().includes(searchText.toLowerCase())).length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      {/* Add/Edit Project Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            margin="normal"
            name="name"
            label="Project Name"
            fullWidth
            required
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            name="description"
            label="Description"
            fullWidth
            required
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Project Manager</InputLabel>
            <Select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              label="Project Manager"
            >
              <MenuItem value="">
                <em>No Manager Assigned</em>
              </MenuItem>
              {users
                .filter(user => user.role === 'project_manager' || user.role === 'admin')
                .map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Team Leader</InputLabel>
            <Select
              name="teamLeaderId"
              value={formData.teamLeaderId}
              onChange={handleChange}
              label="Team Leader"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {users
                .filter(user => user.role === 'team_leader')
                .map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Team Members</InputLabel>
            <Select
              name="teamMemberIds"
              multiple
              value={formData.teamMemberIds}
              onChange={handleChange}
              label="Team Members"
              renderValue={selected =>
                users
                  .filter(u => selected.includes(u.id))
                  .map(u => u.name)
                  .join(', ')
              }
            >
              {users
                .filter(user => user.role === 'team_member')
                .map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    <Checkbox checked={formData.teamMemberIds.includes(user.id)} />
                    <ListItemText primary={user.name} />
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            name="startDate"
            label="Start Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.startDate}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            name="endDate"
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.endDate}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Billing Method</InputLabel>
            <Select
              name="billingMethod"
              value={formData.billingMethod}
              onChange={handleChange}
              label="Billing Method"
            >
              <MenuItem value="hourly">Hourly</MenuItem>
              <MenuItem value="fixed">Fixed Price</MenuItem>
              <MenuItem value="per_transaction">Per Transaction</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            name="estimatedHours"
            label="Estimated Hours"
            type="number"
            fullWidth
            value={formData.estimatedHours}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            name="estimatedTransactions"
            label="Estimated Transactions"
            type="number"
            fullWidth
            value={formData.estimatedTransactions}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editId ? 'Save Changes' : 'Add Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the project "{projectToDelete?.name}"? This action cannot be undone.
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

export default ProjectManagement;
