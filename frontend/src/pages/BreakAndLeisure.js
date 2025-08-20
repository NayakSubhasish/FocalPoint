import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Coffee as CoffeeIcon,
  Restaurant as LunchIcon,
  MeetingRoom as MeetingIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

const breakTypes = [
  { value: 'coffee', label: 'Coffee Break', icon: <CoffeeIcon />, color: '#8B4513' },
  { value: 'lunch', label: 'Lunch Break', icon: <LunchIcon />, color: '#FF6B35' },
  { value: 'meeting', label: 'Meeting', icon: <MeetingIcon />, color: '#1976D2' },
  { value: 'other', label: 'Other', icon: <AddIcon />, color: '#607D8B' },
];

const BreakAndLeisure = () => {
  const { user } = useAuth();
  const [breaks, setBreaks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBreak, setEditingBreak] = useState(null);
  const [activeBreak, setActiveBreak] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    type: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: '',
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    fetchBreaks();
    if (['admin', 'project_manager', 'team_leader'].includes(user?.role)) {
      fetchUsers();
    }
    // Initialize form data when user is loaded
    if (user) {
      resetForm();
    }
  }, [user]);

  const fetchBreaks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Team members should use the regular breaks endpoint (their own breaks only)
      // Admins, project managers, and team leaders can use the /all endpoint
      const url = ['admin', 'project_manager', 'team_leader'].includes(user?.role)
        ? `${process.env.REACT_APP_API_URL}/breaks/all`
        : `${process.env.REACT_APP_API_URL}/breaks`;
      
      console.log('Fetching breaks from URL:', url);
      console.log('User role:', user?.role);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch breaks: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Fetched breaks:', data);
      setBreaks(data);
    } catch (err) {
      console.error('Fetch breaks error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter breaks by selected date
  const getFilteredBreaks = () => {
    if (!selectedDate) return breaks;
    
    const selectedDateObj = new Date(selectedDate);
    const startOfDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
    const endOfDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 23, 59, 59);
    
    return breaks.filter(breakItem => {
      const breakDate = new Date(breakItem.startTime);
      return breakDate >= startOfDay && breakDate <= endOfDay;
    });
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching users...');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Users response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Users error response:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Fetched users:', data);
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleStartBreak = async () => {
    try {
      const token = localStorage.getItem('token');

      // Convert startTime (if present) to ISO string to ensure consistency across environments
      const startPayload = { ...formData };
      if (startPayload.startTime) {
        const s = new Date(startPayload.startTime);
        if (!isNaN(s)) {
          startPayload.startTime = s.toISOString();
        }
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/breaks/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(startPayload),
      });
      if (!response.ok) throw new Error('Failed to start break');
      const data = await response.json();
      setActiveBreak(data);
      setDialogOpen(false);
      fetchBreaks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEndBreak = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/breaks/${activeBreak.id}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to end break');
      setActiveBreak(null);
      fetchBreaks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log('Submit - Current form data:', formData);
      console.log('Submit - User role:', user?.role);
      console.log('Submit - User ID:', user?.id);
      
      // Validate required fields
      if (['admin', 'project_manager', 'team_leader'].includes(user?.role) && !formData.userId) {
        setError('Please select an employee');
        return;
      }
      if (!formData.type) {
        setError('Please select a break type');
        return;
      }
      if (!formData.startTime) {
        setError('Please select a start time');
        return;
      }

      const token = localStorage.getItem('token');
      const url = editingBreak 
        ? `${process.env.REACT_APP_API_URL}/breaks/${editingBreak.id}`
        : `${process.env.REACT_APP_API_URL}/breaks`;
      
      // Ensure userId is set for team members
      const requestData = { ...formData };

      // ==== NEW: normalize date fields to ISO (UTC) to avoid timezone shifts ====
      if (requestData.startTime) {
        const start = new Date(requestData.startTime);
        if (!isNaN(start)) {
          requestData.startTime = start.toISOString();
        }
      }
      if (requestData.endTime) {
        const end = new Date(requestData.endTime);
        if (!isNaN(end)) {
          requestData.endTime = end.toISOString();
        }
      }
      // ========================================================================

      if (user?.role === 'team_member') {
        requestData.userId = user.id; // Always use the current user's ID for team members
      }
      
      console.log('Submitting break data:', requestData);
      console.log('User role:', user?.role);
      console.log('URL:', url);
      
      const response = await fetch(url, {
        method: editingBreak ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to save break: ${response.status} ${errorText}`);
      }
      
      setDialogOpen(false);
      setEditingBreak(null);
      resetForm();
      fetchBreaks();
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (breakId) => {
    if (!window.confirm('Are you sure you want to delete this break?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/breaks/${breakId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete break');
      fetchBreaks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (breakItem) => {
    setEditingBreak(breakItem);
    setFormData({
      userId: breakItem.userId || user?.id || '',
      type: breakItem.type,
      description: breakItem.description,
      startTime: breakItem.startTime,
      endTime: breakItem.endTime,
      duration: breakItem.duration,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    const newFormData = {
      userId: ['admin', 'project_manager', 'team_leader'].includes(user?.role) ? '' : (user?.id || ''),
      type: '',
      description: '',
      startTime: '',
      endTime: '',
      duration: '',
    };
    console.log('Resetting form - User role:', user?.role);
    console.log('Resetting form - User ID:', user?.id);
    console.log('Resetting form - New form data:', newFormData);
    setFormData(newFormData);
  };

  const openDialog = () => {
    setEditingBreak(null);
    resetForm();
    console.log('Opening dialog - User role:', user?.role);
    console.log('Opening dialog - User ID:', user?.id);
    console.log('Opening dialog - Form data after reset:', {
      userId: ['admin', 'project_manager', 'team_leader'].includes(user?.role) ? '' : user?.id || '',
      type: '',
      description: '',
      startTime: '',
      endTime: '',
      duration: '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingBreak(null);
    resetForm();
  };

  const getBreakTypeInfo = (type) => {
    return breakTypes.find(bt => bt.value === type) || breakTypes[breakTypes.length - 1];
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayBreaks = breaks.filter(breakItem => 
      new Date(breakItem.startTime).toDateString() === today
    );
    
    const totalMinutes = todayBreaks.reduce((sum, breakItem) => sum + (breakItem.duration || 0), 0);
    const breakCount = todayBreaks.length;
    
    return { totalMinutes, breakCount };
  };

  const getSelectedDateStats = () => {
    if (!selectedDate) return getTodayStats();
    
    const selectedDateObj = new Date(selectedDate);
    const startOfDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
    const endOfDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 23, 59, 59);
    
    const selectedDateBreaks = breaks.filter(breakItem => {
      const breakDate = new Date(breakItem.startTime);
      return breakDate >= startOfDay && breakDate <= endOfDay;
    });
    
    const totalMinutes = selectedDateBreaks.reduce((sum, breakItem) => sum + (breakItem.duration || 0), 0);
    const breakCount = selectedDateBreaks.length;
    
    return { totalMinutes, breakCount };
  };

  // Helper function to check if user can edit breaks
  const canEditBreaks = () => {
    return user?.role !== 'team_member';
  };

  const { totalMinutes, breakCount } = getSelectedDateStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Break & Leisure Management
        {user?.role === 'team_member' && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            You can view and add breaks, but cannot edit or delete them. Contact your manager for modifications.
          </Typography>
        )}
        {!['admin', 'project_manager', 'team_leader', 'team_member'].includes(user?.role) && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            You can only view and manage your own breaks.
          </Typography>
        )}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Date Filter */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <CalendarIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Today'}
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ minWidth: 150 }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowDateFilter(!showDateFilter)}
                size="small"
              >
                {showDateFilter ? 'Hide' : 'Show'} Filters
              </Button>
            </Box>
          </Box>
          
          {showDateFilter && (
            <Box mt={2} display="flex" gap={2} flexWrap="wrap">
              <Button
                variant={selectedDate === new Date().toISOString().split('T')[0] ? "contained" : "outlined"}
                size="small"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              >
                Today
              </Button>
              <Button
                variant={selectedDate === new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0] ? "contained" : "outlined"}
                size="small"
                onClick={() => setSelectedDate(new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0])}
              >
                Yesterday
              </Button>
              <Button
                variant={selectedDate === new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0] ? "contained" : "outlined"}
                size="small"
                onClick={() => setSelectedDate(new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0])}
              >
                Last Week
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedDate('')}
              >
                All Time
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {breakCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedDate ? 'Breaks on Selected Date' : 'Breaks Today'}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {formatDuration(totalMinutes)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedDate ? 'Break Time on Selected Date' : 'Total Break Time'}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {breakCount > 0 ? formatDuration(Math.round(totalMinutes / breakCount)) : '0m'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Average Break Duration
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {activeBreak ? 'Active' : 'None'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Current Break Status
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Active Break Card */}
      {activeBreak && (
        <Card sx={{ mb: 3, bgcolor: 'success.light', color: 'white' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Active Break: {getBreakTypeInfo(activeBreak.type).label}
              </Typography>
              <Typography variant="body2">
                Started at {new Date(activeBreak.startTime).toLocaleTimeString()}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleEndBreak}
            >
              End Break
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Break History Table */}
      <Card elevation={3}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Break History
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openDialog}
              disabled={!!activeBreak}
            >
              {['admin', 'project_manager', 'team_leader'].includes(user?.role) ? 'Add Break for Employee' : 'Add Break'}
            </Button>
          </Box>
          
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredBreaks().length > 0 ? (
                  getFilteredBreaks().map((breakItem) => {
                    const breakType = getBreakTypeInfo(breakItem.type);
                    return (
                      <TableRow key={breakItem.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {breakItem.user?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: breakType.color,
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            {breakType.icon}
                            {breakType.label}
                          </Box>
                        </TableCell>
                        <TableCell>{breakItem.description || '-'}</TableCell>
                        <TableCell>
                          {new Date(breakItem.startTime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {breakItem.endTime 
                            ? new Date(breakItem.endTime).toLocaleString()
                            : 'Active'
                          }
                        </TableCell>
                        <TableCell>
                          {breakItem.duration ? formatDuration(breakItem.duration) : '-'}
                        </TableCell>
                        <TableCell>
                          {/* Only show edit/delete buttons for non-team members */}
                          {user?.role !== 'team_member' && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(breakItem)}
                                disabled={!breakItem.endTime}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(breakItem.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                          {user?.role === 'team_member' && (
                            <Typography variant="caption" color="textSecondary">
                              Contact manager to modify
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        {selectedDate 
                          ? `No breaks found for ${new Date(selectedDate).toLocaleDateString()}`
                          : 'No breaks found'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Break Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBreak 
            ? (['admin', 'project_manager', 'team_leader'].includes(user?.role) ? 'Edit Break' : (user?.role === 'team_member' ? 'View Break (Read Only)' : 'Edit Your Break'))
            : (['admin', 'project_manager', 'team_leader'].includes(user?.role) ? 'Add Break for Employee' : 'Add New Break')
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Employee Selection - Only show for admins, project managers, and team leaders */}
            {['admin', 'project_manager', 'team_leader'].includes(user?.role) && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  label="Employee"
                >
                  {users.map((userItem) => (
                    <MenuItem key={userItem.id} value={userItem.id}>
                      {userItem.name} ({userItem.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {/* Show employee info for team members */}
            {user?.role === 'team_member' && !editingBreak && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Creating break for: <strong>{user.name}</strong>
                </Typography>
              </Box>
            )}
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Break Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Break Type"
                disabled={user?.role === 'team_member' && editingBreak}
              >
                {breakTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              disabled={user?.role === 'team_member' && editingBreak}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  disabled={user?.role === 'team_member' && editingBreak}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="End Time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  disabled={user?.role === 'team_member' && editingBreak}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={
              !formData.type || 
              (['admin', 'project_manager', 'team_leader'].includes(user?.role) && !formData.userId) ||
              (user?.role === 'team_member' && editingBreak)
            }
          >
            {editingBreak ? (user?.role === 'team_member' ? 'Read Only' : 'Update') : 'Add Break'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Start Break FAB - Only for team members */}
      {!activeBreak && !['admin', 'project_manager', 'team_leader'].includes(user?.role) && (
        <Tooltip title="Quick Start Break">
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => {
              setFormData({
                ...formData,
                startTime: new Date().toISOString().slice(0, 16),
                type: 'coffee'
              });
              setDialogOpen(true);
            }}
          >
            <StartIcon />
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
};

export default BreakAndLeisure;
