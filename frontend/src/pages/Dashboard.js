import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
  Fade,
  Grow,
  Slide,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip as RechartTooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Coffee as CoffeeIcon,
  Restaurant as RestaurantIcon,
  MeetingRoom as MeetingIcon,
  MoreHoriz as MoreIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Business as ProjectIcon,
  AccessTime as TimeIcon,
  EventNote as EventIcon,
} from '@mui/icons-material';

const statLabels = [
  { 
    key: 'totalProjects', 
    label: 'Total Projects', 
    icon: <ProjectIcon />, 
    color: 'primary',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  { 
    key: 'totalTasks', 
    label: 'Total Tasks', 
    icon: <AssignmentIcon />, 
    color: 'secondary',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  { 
    key: 'totalUsers', 
    label: 'Total Users', 
    icon: <PeopleIcon />, 
    color: 'success',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  { 
    key: 'totalHours', 
    label: 'Total Hours Logged', 
    icon: <TimeIcon />, 
    color: 'info',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  { 
    key: 'totalTransactions', 
    label: 'Total Transactions', 
    icon: <MoneyIcon />, 
    color: 'warning',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  { 
    key: 'totalBreaks', 
    label: 'Total Breaks', 
    icon: <CoffeeIcon />, 
    color: 'error',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    key: 'totalBreakHours', 
    label: 'Break Hours', 
    icon: <RestaurantIcon />, 
    color: 'primary',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
  },
  { 
    key: 'activeProjects', 
    label: 'Active Projects', 
    icon: <WorkIcon />, 
    color: 'success',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  },
  { 
    key: 'completedTasks', 
    label: 'Completed Tasks', 
    icon: <AssessmentIcon />, 
    color: 'info',
    gradient: 'linear-gradient(135deg, #a8caba 0%, #5d4e75 100%)'
  },
  { 
    key: 'pendingTasks', 
    label: 'Pending Tasks', 
    icon: <ScheduleIcon />, 
    color: 'warning',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
];

const reportList = [
  { 
    key: 'projectsByStatus', 
    label: 'Projects by Status', 
    icon: <PieChartIcon />, 
    description: 'Distribution of projects across different statuses',
    color: 'primary'
  },
  { 
    key: 'tasksByStatus', 
    label: 'Tasks by Status', 
    icon: <BarChartIcon />, 
    description: 'Overview of task completion status',
    color: 'secondary'
  },
  { 
    key: 'tasksByPriority', 
    label: 'Tasks by Priority', 
    icon: <TimelineIcon />, 
    description: 'Task distribution by priority levels',
    color: 'warning'
  },
  { 
    key: 'transactionsByTask', 
    label: 'Transactions per Task', 
    icon: <MoneyIcon />, 
    description: 'Transaction volume across different tasks',
    color: 'success'
  },
  { 
    key: 'userWorkload', 
    label: 'User Workload', 
    icon: <GroupIcon />, 
    description: 'Workload distribution among team members',
    color: 'info'
  },
  { 
    key: 'projectReport', 
    label: 'Project Overview', 
    icon: <DashboardIcon />, 
    description: 'Comprehensive project performance metrics',
    color: 'primary'
  },
  { 
    key: 'dailyUserLogs', 
    label: 'Daily Time Logs', 
    icon: <TimeIcon />, 
    description: 'Daily time tracking and productivity insights',
    color: 'secondary'
  },
  { 
    key: 'monthlyUserLogs', 
    label: 'Monthly Time Logs', 
    icon: <EventIcon />, 
    description: 'Monthly aggregated time and transaction data',
    color: 'info'
  },
  { 
    key: 'breaksLeisure', 
    label: 'Breaks & Leisure Report', 
    icon: <CoffeeIcon />, 
    description: 'Comprehensive break and leisure time analysis',
    color: 'error'
  }
];

// Mapping of report keys to API endpoints and table keys
const reportConfig = {
  projectsByStatus: { endpoint: 'projects-by-status', labelKey: 'status', valueKey: 'count', title: 'Projects by Status' },
  tasksByStatus: { endpoint: 'tasks-by-status', labelKey: 'status', valueKey: 'count', title: 'Tasks by Status' },
  tasksByPriority: { endpoint: 'tasks-by-priority', labelKey: 'priority', valueKey: 'count', title: 'Tasks by Priority' },
  transactionsByTask: { endpoint: 'transactions-by-task', labelKey: 'title', valueKey: 'transactions', title: 'Transactions per Task' },
  userWorkload: { endpoint: 'user-workload', labelKey: 'user', valueKey: 'count', title: 'User Workload' },
  projectReport: { endpoint: 'project-report', title: 'Project Overview' },
  dailyUserLogs: { endpoint: 'user-daily-logs', title: 'Daily Time Logs' },
  monthlyUserLogs: { endpoint: 'user-monthly-logs', title: 'Monthly Time Logs' },
  breaksLeisure: { endpoint: 'breaks-leisure', title: 'Breaks & Leisure Report' }
};

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Enhanced color palette for charts
  const COLORS = [
    "#667eea", // Primary Blue
    "#f093fb", // Pink
    "#4facfe", // Cyan
    "#43e97b", // Green
    "#fa709a", // Rose
    "#a8edea", // Mint
    "#ff9a9e", // Coral
    "#a8caba", // Sage
    "#ffecd2", // Peach
    "#764ba2", // Purple
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const [dailyDate, setDailyDate] = useState(todayStr);
  const [monthlyFilter, setMonthlyFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        // Include dateRange filters if set
        const params = new URLSearchParams();
        if (dateRange.startDate && dateRange.endDate) {
          params.append('startDate', dateRange.startDate);
          params.append('endDate', dateRange.endDate);
        }
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/dashboard/stats?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [dateRange]);

  // Handler for fetching report data
  const fetchReportData = async (key, extraParams = {}) => {
    setSelectedReport(key);
    setLoadingReport(true);
    setErrorReport('');
    try {
      const token = localStorage.getItem('token');
      const { endpoint } = reportConfig[key];
      const urlParams = new URLSearchParams(extraParams).toString();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/dashboard/reports/${endpoint}?${urlParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch report');
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setErrorReport(err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleReportClick = (key) => {
    if (key === 'dailyUserLogs') {
      fetchReportData(key, { date: dailyDate });
    } else if (key === 'monthlyUserLogs') {
      fetchReportData(key, { month: monthlyFilter });
    } else {
      fetchReportData(key);
    }
  };

  // Refetch daily logs when date changes and daily report is selected
  useEffect(() => {
    if (selectedReport === 'dailyUserLogs') {
      fetchReportData('dailyUserLogs', { date: dailyDate });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyDate]);

  // Refetch monthly logs when filter changes and monthly report is selected
  useEffect(() => {
    if (selectedReport === 'monthlyUserLogs') {
      fetchReportData('monthlyUserLogs', { month: monthlyFilter });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyFilter]);

  // Refresh dashboard data
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setLoading(true);
    setError('');
    // Refetch stats
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (dateRange.startDate && dateRange.endDate) {
          params.append('startDate', dateRange.startDate);
          params.append('endDate', dateRange.endDate);
        }
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/dashboard/stats?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  };

  // Export current report to CSV
  const exportReportCsv = () => {
    if (!selectedReport) return;
    
    // Check if report data exists based on report type
    if (selectedReport === 'breaksLeisure') {
      if (!reportData.detailedBreaks || reportData.detailedBreaks.length === 0) return;
    } else if (selectedReport === 'projectReport') {
      if (!reportData || reportData.length === 0) return;
    } else if (selectedReport === 'dailyUserLogs' || selectedReport === 'monthlyUserLogs') {
      if (!reportData || reportData.length === 0) return;
    } else {
      if (!reportData || reportData.length === 0) return;
    }
    
    const { labelKey, valueKey, title } = reportConfig[selectedReport];
    let headers = [];
    let csvRows = [];

    if (selectedReport === 'dailyUserLogs' || selectedReport === 'monthlyUserLogs') {
      headers = ['Employee','Project','Task','Hours','Transactions'];
      csvRows = [headers.join(',')];
      reportData.forEach((row) => {
        csvRows.push([row.user, row.project, row.task, row.hours, row.transactions].join(','));
      });
    } else if (selectedReport === 'breaksLeisure') {
      headers = ['Employee','Type','Description','Start Time','End Time','Duration (Hours)','Date','Status'];
      csvRows = [headers.join(',')];
      reportData.detailedBreaks.forEach((row) => {
        csvRows.push([
          row.employee,
          row.type,
          row.description || '',
          row.startTime,
          row.endTime || '',
          row.durationHours,
          row.date,
          row.isActive ? 'Active' : 'Completed'
        ].join(','));
      });
    } else if (selectedReport === 'projectReport') {
      headers = ['Project Name','Projects This Month','Tasks Today','Records Logged','Records Processed','Avg Minutes per Record','Total Hours','Records per Agent','Time per Agent'];
      csvRows = [headers.join(',')];
      reportData.forEach((row) => {
        const recordsPerAgent = row.recordsPerAgent?.map(a => `${a.user}:${a.count}`).join('; ') || '';
        const timePerAgent = row.timePerAgent?.map(a => `${a.user}:${a.hours}hrs`).join('; ') || '';
        csvRows.push([
          row.projectName,
          row.projectsReceived,
          row.tasksToday,
          row.recordsLogged,
          row.recordsProcessed,
          row.avgMinutesPerRecord,
          row.totalHours,
          recordsPerAgent,
          timePerAgent
        ].join(','));
      });
    } else {
      headers = [labelKey, valueKey];
      csvRows = [headers.join(',')];
    reportData.forEach(row => {
      csvRows.push([row[labelKey], row[valueKey]].join(','));
    });
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g,'_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="60vh"
      gap={2}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : theme.palette.text.secondary }}>
        Loading Dashboard Data...
      </Typography>
      <LinearProgress sx={{ width: '50%', maxWidth: 400 }} />
    </Box>
  );
  
  if (error) return (
    <Box p={3}>
      <Alert 
        severity="error" 
        sx={{ 
          mt: 4, 
          borderRadius: 2,
          '& .MuiAlert-icon': { fontSize: 28 }
        }}
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={handleRefresh}
          >
            <RefreshIcon />
          </IconButton>
        }
      >
        {error}
      </Alert>
    </Box>
  );
  
  if (!stats) return null;

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        p: { xs: 2, md: 4 }
      }}
    >
      {/* Header Section */}
      <Box 
        sx={{ 
          mb: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 3,
          p: 3,
          color: 'white',
          boxShadow: theme.shadows[8],
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: alpha('#fff', 0.1),
            zIndex: 0
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                📊 Dashboard Overview
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, color: 'white' }}>
                Real-time insights and analytics for your project management
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <IconButton 
                onClick={handleRefresh}
                sx={{ 
                  color: 'white',
                  '&:hover': { 
                    background: alpha('#fff', 0.1),
                    transform: 'rotate(180deg)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Date Filters */}
      <Box 
        sx={{ 
          mb: 4,
          p: 3,
          background: 'white',
          borderRadius: 3,
          boxShadow: theme.shadows[2],
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <FilterIcon color="primary" />
          <Typography variant="h6" fontWeight={600} sx={{ color: '#000000' }}>
            Date Range Filter
          </Typography>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
        <TextField
          type="date"
          label="Start Date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          size="small"
            sx={{ minWidth: 200 }}
        />
        <TextField
          type="date"
          label="End Date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          size="small"
            sx={{ minWidth: 200 }}
        />
      </Box>
      </Box>
      {/* Quick Stats Summary */}
      <Box 
        sx={{ 
          mb: 4,
          p: 3,
          background: 'white',
          borderRadius: 3,
          boxShadow: theme.shadows[2],
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#000000' }}>
            <TrendingUpIcon color="success" />
            Performance Overview
          </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                <WorkIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#666666' }}>Active Projects</Typography>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#000000' }}>{stats.activeProjects || 0}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                <AssessmentIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#666666' }}>Completed Tasks</Typography>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#000000' }}>{stats.completedTasks || 0}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                <ScheduleIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#666666' }}>Pending Tasks</Typography>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#000000' }}>{stats.pendingTasks || 0}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
                <CoffeeIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#666666' }}>Total Breaks</Typography>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#000000' }}>{stats.totalBreaks || 0}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Statistics Cards */}
      <Box mb={4}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#000000' }}>
            <AssessmentIcon color="primary" />
            Key Metrics
          </Typography>
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(5, 1fr)'
            },
            gap: 2,
            '& > *': {
              width: '100%',
              height: '120px !important',
            }
          }}
        >
          {statLabels.map(({ key, label, icon, gradient, color }, index) => (
            <Grow in timeout={300 + index * 100} key={key}>
            <Card
                elevation={0}
              sx={{
                  borderRadius: 3,
                  background: gradient,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%',
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': { 
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                    '& .stat-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.1)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover::before': {
                    opacity: 1,
                  }
                }}
              >
                                                      <CardContent 
              sx={{
                      p: 1.5, 
                      color: 'white', 
                      position: 'relative', 
                      zIndex: 1,
                      height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                      textAlign: 'center',
                      flex: 1
                    }}
                  >
                    <Box
                      className="stat-icon"
                      sx={{
                        transition: 'transform 0.3s ease',
                        p: 0.6,
                        borderRadius: 1.5,
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        mb: 0.5,
                      }}
                    >
                      {React.cloneElement(icon, { sx: { fontSize: 18 } })}
                    </Box>
                                        <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 800, 
                        mb: 0.2, 
                        fontSize: { xs: '1.8rem', md: '2rem' },
                        lineHeight: 1.1,
                        textAlign: 'center',
                        color: 'white'
                      }}
                    >
                  {(stats[key] ?? 0).toLocaleString()}
                </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        opacity: 0.95, 
                        fontWeight: 700,
                        textAlign: 'center',
                        lineHeight: 1.1,
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        color: 'white'
                      }}
                    >
                      {label}
                </Typography>
              </CardContent>
            </Card>
              </Grow>
          ))}
        </Box>
      </Box>
      {/* Reports Section */}
      <Box mb={4}>
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between" 
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary }}>
            <BarChartIcon color="primary" />
            Analytics & Reports
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton 
              color="primary" 
              onClick={exportReportCsv} 
              disabled={!selectedReport || reportData.length === 0}
              sx={{
                '&:hover': { 
                  transform: 'scale(1.1)',
                  transition: 'transform 0.2s ease'
                }
              }}
            >
            <DownloadIcon />
          </IconButton>
        </Box>
        </Box>
        
                <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2.5,
            '& > *': {
              width: '100%',
              height: '120px !important',
            }
          }}
        >
          {reportList.map(({ key, label, icon, description, color }, index) => (
            <Slide direction="up" in timeout={400 + index * 100} key={key}>
              <Card
                elevation={0}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  background: 'white',
                  border: `2px solid ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.1)}`,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%',
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                    borderColor: theme.palette[color]?.main || theme.palette.primary.main,
                    '& .report-icon': {
                      transform: 'scale(1.1)',
                      color: theme.palette[color]?.main || theme.palette.primary.main,
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${theme.palette[color]?.main || theme.palette.primary.main} 0%, ${theme.palette[color]?.light || theme.palette.primary.light} 100%)`,
                    transform: 'scaleX(0)',
                    transition: 'transform 0.3s ease',
                  },
                  '&:hover::before': {
                    transform: 'scaleX(1)',
                  }
                }}
                onClick={() => handleReportClick(key)}
              >
                <CardContent 
                  sx={{ 
                    p: 2, 
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} mb={0.5}>
                    <Box
                      className="report-icon"
                      sx={{
                        transition: 'all 0.3s ease',
                        p: 1.2,
                        borderRadius: 2,
                        background: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.1),
                        color: theme.palette[color]?.main || theme.palette.primary.main,
                        flexShrink: 0,
                      }}
                    >
                      {React.cloneElement(icon, { sx: { fontSize: 22 } })}
                    </Box>
                    <Box flex={1} sx={{ minWidth: 0 }}>
                                            <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 0.3,
                          fontSize: '1.2rem',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: '#000000'
                        }}
                      >
                    {label}
                  </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          color: '#666666'
                        }}
                      >
                        {description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Slide>
          ))}
        </Box>
      </Box>
      {/* Report Details */}
      {loadingReport && (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          py={4}
          gap={2}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : theme.palette.text.secondary }}>
            Loading report data...
          </Typography>
        </Box>
      )}
      
      {errorReport && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2, 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 24 }
          }}
        >
          {errorReport}
        </Alert>
      )}
      
      {selectedReport && !loadingReport && !errorReport && (
        <Fade in timeout={500}>
          <Box 
            mt={4}
            sx={{
              background: 'white',
              borderRadius: 3,
              p: 3,
              boxShadow: theme.shadows[2],
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              {React.cloneElement(reportList.find(r => r.key === selectedReport)?.icon || <AssessmentIcon />, { 
                color: 'primary',
                sx: { fontSize: 28 }
              })}
                          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary }}>
              {reportConfig[selectedReport].title}
            </Typography>
            </Box>
          {selectedReport === 'projectReport' ? (
            <TableContainer component={Paper} sx={{ maxHeight: 440, borderRadius: 2, boxShadow: 3 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['Project','Projects This Month','Tasks Today','Records Logged','Records Processed','Avg Minutes per Record','Total Hours','Records per Agent','Time per Agent'].map((header) => (
                      <TableCell
                        key={header}
                        sx={{
                          backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.map((row) => (
                    <TableRow key={row.projectName} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{row.projectName}</TableCell>
                      <TableCell>{row.projectsReceived}</TableCell>
                      <TableCell>{row.tasksToday}</TableCell>
                      <TableCell>{row.recordsLogged}</TableCell>
                      <TableCell>{row.recordsProcessed}</TableCell>
                      <TableCell>{row.avgMinutesPerRecord}</TableCell>
                      <TableCell>{row.totalHours}</TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {row.recordsPerAgent.map((a) => (
                            <Chip key={a.user} label={`${a.user} - ${a.count}`} size="small" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {row.timePerAgent.map((a) => (
                            <Chip key={a.user} label={`${a.user} - ${a.hours} hrs`} size="small" />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : selectedReport === 'dailyUserLogs' || selectedReport === 'monthlyUserLogs' ? (
            <>
              {selectedReport === 'dailyUserLogs' && (
                <Box mb={2} display="flex" gap={2}>
                  <TextField
                    type="date"
                    label="Select Date"
                    size="small"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              )}
              {selectedReport === 'monthlyUserLogs' && (
                <Box mb={2} display="flex" gap={2}>
                  <TextField
                    type="month"
                    label="Select Month"
                    size="small"
                    value={monthlyFilter}
                    onChange={(e) => setMonthlyFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              )}
              <TableContainer component={Paper} sx={{ maxHeight: 440, borderRadius: 2, boxShadow: 3 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Employee','Project','Task','Hours','Transactions'].map((header) => (
                        <TableCell
                          key={header}
                          sx={{
                            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
                            fontWeight: 'bold',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row) => (
                      <TableRow key={row.user} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{row.user}</TableCell>
                        <TableCell>{row.project}</TableCell>
                        <TableCell>{row.task}</TableCell>
                        <TableCell>{row.hours}</TableCell>
                        <TableCell>{row.transactions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : selectedReport === 'breaksLeisure' ? (
            <Box>
              {/* Summary Statistics */}
              {reportData.summary && (
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h6">{reportData.summary.totalBreaks}</Typography>
                      <Typography variant="body2">Total Breaks</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h6">{reportData.summary.totalHours}</Typography>
                      <Typography variant="body2">Total Hours</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                      <Typography variant="h6">{reportData.summary.averageHours}</Typography>
                      <Typography variant="body2">Avg Hours/Break</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                      <Typography variant="h6">{reportData.summary.averageDuration}</Typography>
                      <Typography variant="body2">Avg Minutes/Break</Typography>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Breaks by Type Chart */}
              {reportData.breaksByType && (
                <Box mb={4}>
                  <Typography variant="h6" mb={2}>Breaks by Type</Typography>
                  <Box width="100%" height={300}>
                    <ResponsiveContainer>
                      <PieChart animationDuration={500}>
                        <Pie
                          data={Object.entries(reportData.breaksByType).map(([type, data]) => ({
                            name: type.charAt(0).toUpperCase() + type.slice(1),
                            value: data.count,
                            duration: data.duration
                          }))}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {Object.entries(reportData.breaksByType).map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} />
                        <RechartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {/* Detailed Breaks Table */}
              {reportData.detailedBreaks && (
                <Box>
                  <Typography variant="h6" mb={2}>Detailed Breaks</Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 440, borderRadius: 2, boxShadow: 3 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {['Employee','Type','Description','Start Time','End Time','Duration (Hours)','Date','Status'].map((header) => (
                            <TableCell
                              key={header}
                              sx={{
                                backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                              }}
                            >
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.detailedBreaks.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{row.employee}</TableCell>
                            <TableCell>
                              <Chip 
                                label={row.type.charAt(0).toUpperCase() + row.type.slice(1)} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{row.description || '-'}</TableCell>
                            <TableCell>{new Date(row.startTime).toLocaleString()}</TableCell>
                            <TableCell>{row.endTime ? new Date(row.endTime).toLocaleString() : 'Active'}</TableCell>
                            <TableCell>{row.durationHours}</TableCell>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>
                              <Chip 
                                label={row.isActive ? 'Active' : 'Completed'} 
                                size="small" 
                                color={row.isActive ? 'warning' : 'success'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          ) : (
            <Box width="100%" height={300}>
              <ResponsiveContainer>
                {['tasksByStatus','projectsByStatus'].includes(selectedReport) ? (
                  <PieChart animationDuration={500}>
                    <Pie
                      data={reportData}
                      dataKey={reportConfig[selectedReport].valueKey}
                      nameKey={reportConfig[selectedReport].labelKey}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {reportData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <RechartTooltip />
                  </PieChart>
                ) : (
                  <BarChart
                    data={reportData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={reportConfig[selectedReport].labelKey} />
                    <YAxis />
                    <RechartTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                    <Bar dataKey={reportConfig[selectedReport].valueKey}>
                      {reportData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      </Fade>
      )}
    </Box>
  );
};

export default Dashboard; 