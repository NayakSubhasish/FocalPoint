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
  Snackbar,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import useDebounce from '../hooks/useDebounce';

const TaskManagement = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 500);
  const [orderBy, setOrderBy] = useState('title');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    status: 'todo',
    priority: 'medium',
    estimatedHours: '',
    deadline: '',
    estimatedTransactions: '',
    transactionType: '',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProjects();
      if (user.role !== 'team_member') {
        fetchUsers();
      }
    }
  }, [debouncedSearch, user]);

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const endpoint = user && user.role === 'team_member'
        ? `${process.env.REACT_APP_API_URL}/tasks/my-tasks`
        : `${process.env.REACT_APP_API_URL}/tasks`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchProjects = async () => {
    try {
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

  const handleOpen = (task = null) => {
    setError('');
    setSuccess('');
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        projectId: task.projectId || '',
        assignedTo: task.assignedTo || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        estimatedHours: task.estimatedHours || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
        estimatedTransactions: task.estimatedTransactions || '',
        transactionType: task.transactionType || '',
      });
      setEditId(task.id);
    } else {
      setFormData({
        title: '',
        description: '',
        projectId: '',
        assignedTo: '',
        status: 'todo',
        priority: 'medium',
        estimatedHours: '',
        deadline: '',
        estimatedTransactions: '',
        transactionType: '',
      });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.title || !formData.projectId) {
      setError('Title and project are required');
      return;
    }

    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId 
        ? `${process.env.REACT_APP_API_URL}/tasks/${editId}`
        : `${process.env.REACT_APP_API_URL}/tasks`;
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          estimatedHours: parseFloat(formData.estimatedHours) || 0,
          estimatedTransactions: parseInt(formData.estimatedTransactions) || 0,
          transactionType: formData.transactionType,
          assignedTo: formData.assignedTo || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editId ? 'update' : 'create'} task`);
      }
      
      const msg = editId ? 'Task updated successfully!' : 'Task created successfully!';
      setSnackbarMsg(msg);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleClose();
      fetchTasks();
    } catch (error) {
      console.error(`Error ${editId ? 'updating' : 'creating'} task:`, error);
      setSnackbarMsg(error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
      title: '',
      description: '',
      projectId: '',
      assignedTo: '',
      status: 'todo',
      priority: 'medium',
      estimatedHours: '',
      deadline: '',
      estimatedTransactions: '',
      transactionType: '',
    });
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete task');
      }
      
      setSuccess('Task deleted successfully!');
      setDeleteOpen(false);
      setTaskToDelete(null);
      fetchTasks();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.message);
      setDeleteOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteOpen(false);
    setTaskToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'review': return 'warning';
      case 'todo': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
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

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
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

  const handleSnackbarClose = () => setSnackbarOpen(false);

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Task Management</Typography>
      <Box mb={2} display="flex" justifyContent="space-between">
        <TextField
          size="small"
          label="Search Tasks"
          variant="outlined"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </Box>
      {user.role !== 'team_member' && (
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpen()} 
          sx={{ mb: 2 }}
        >
          Add New Task
        </Button>
      )}
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose} message={snackbarMsg} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === 'title' ? order : false}>
                <TableSortLabel active={orderBy === 'title'} direction={orderBy === 'title' ? order : 'asc'} onClick={() => handleSort('title')}>Title</TableSortLabel>
              </TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Est. Hours</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingTasks
              ? Array.from({ length: rowsPerPage }).map((_, idx) => (
                  <TableRow key={idx}>
                    {[...Array(8)].map((__, c) => <TableCell key={c}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
              : stableSort(
                  tasks.filter((t) => t.title.toLowerCase().includes(debouncedSearch.toLowerCase())),
                  getComparator(order, orderBy)
                )
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{task.Project?.name || 'No Project'}</TableCell>
                      <TableCell>{task.assignee?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={task.status.replace('_', ' ')} 
                          color={getStatusColor(task.status)}
                          clickable={false}
                          onClick={() => {}}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={task.priority} 
                          color={getPriorityColor(task.priority)}
                          clickable={false}
                          onClick={() => {}}
                        />
                      </TableCell>
                      <TableCell>{task.estimatedHours || 0}</TableCell>
                      <TableCell>{formatDate(task.deadline)}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpen(task)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        {user.role !== 'team_member' && (
                          <Tooltip title="Delete">
                            <IconButton onClick={() => handleDeleteClick(task)}>
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
          count={tasks.filter((t) => t.title.toLowerCase().includes(debouncedSearch.toLowerCase())).length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      {/* Add/Edit Task Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            margin="normal"
            name="title"
            label="Task Title"
            fullWidth
            required
            value={formData.title}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Project</InputLabel>
            <Select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              label="Project"
              required
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Assigned To</InputLabel>
            <Select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              label="Assigned To"
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name}
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
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
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
            name="deadline"
            label="Deadline"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.deadline}
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
          <FormControl fullWidth margin="normal">
            <InputLabel>Transaction Type</InputLabel>
            <Select
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              label="Transaction Type"
            >
              <MenuItem value=''><em>None</em></MenuItem>
              <MenuItem value='pages'>Pages</MenuItem>
              <MenuItem value='images'>Images</MenuItem>
              <MenuItem value='records'>Records</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editId ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the task "{taskToDelete?.title}"? This action cannot be undone.
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

export default TaskManagement; 