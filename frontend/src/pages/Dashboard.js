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
} from 'recharts';
import { Download as DownloadIcon } from '@mui/icons-material';

const statLabels = [
  { key: 'totalProjects', label: 'Total Projects' },
  { key: 'totalTasks', label: 'Total Tasks' },
  { key: 'totalUsers', label: 'Total Users' },
  { key: 'totalHours', label: 'Total Hours Logged' },
  { key: 'totalTransactions', label: 'Total Transactions' },
  { key: 'activeProjects', label: 'Active Projects' },
  { key: 'completedTasks', label: 'Completed Tasks' },
  { key: 'pendingTasks', label: 'Pending Tasks' },
];

const reportList = [
  { key: 'projectsByStatus', label: 'Projects by Status' },
  { key: 'tasksByStatus', label: 'Tasks by Status' },
  { key: 'tasksByPriority', label: 'Tasks by Priority' },
  { key: 'transactionsByTask', label: 'Transactions per Task' },
  { key: 'userWorkload', label: 'User Workload' },
  { key: 'projectReport', label: 'Project Overview' },
  { key: 'dailyUserLogs', label: 'Daily Time Logs' },
  { key: 'monthlyUserLogs', label: 'Monthly Time Logs' }
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
  monthlyUserLogs: { endpoint: 'user-monthly-logs', title: 'Monthly Time Logs' }
};

const Dashboard = () => {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState('');
  // Color palette for charts
  const COLORS = [
    "#FF6B6B", // Vibrant Red
    "#4ECDC4", // Teal
    "#FFD93D", // Yellow
    "#1A535C", // Deep Blue
    "#FF9F1C", // Orange
    "#5F6CAF", // Indigo
    "#B388FF", // Purple
    "#43AA8B", // Green
    "#F15BB5", // Pink
    "#00B8A9", // Aqua
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const [dailyDate, setDailyDate] = useState(todayStr);

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
      fetchReportData(key); // current month by default
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

  // Export current report to CSV
  const exportReportCsv = () => {
    if (!selectedReport || !reportData.length) return;
    const { labelKey, valueKey, title } = reportConfig[selectedReport];
    let headers = [];
    let csvRows = [];

    if (selectedReport === 'dailyUserLogs' || selectedReport === 'monthlyUserLogs') {
      headers = ['Employee','Project','Task','Hours','Transactions'];
      csvRows = [headers.join(',')];
      reportData.forEach((row) => {
        csvRows.push([row.user, row.project, row.task, row.hours, row.transactions].join(','));
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

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  if (!stats) return null;

  return (
    <Box p={3}>
      <Typography variant="h5" mb={3}>Dashboard</Typography>
      <Box display="flex" gap={2} mb={3}>
        <TextField
          type="date"
          label="Start Date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          type="date"
          label="End Date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
      </Box>
      <Grid container spacing={3}>
        {statLabels.map(({ key, label }) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 2,
                boxShadow: 3,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' },
                minHeight: 120,
                minWidth: 220,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" color="textSecondary" sx={{ fontSize: '1.1rem', fontWeight: 500, mb: 1, textAlign: 'left' }}>
                  {label}
                </Typography>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 700, fontSize: '2rem', textAlign: 'left', lineHeight: 1.2 }}>
                  {stats[key] ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box mt={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h5" sx={{ flexGrow: 1, fontSize: '1.25rem', fontWeight: 600 }}>Reports</Typography>
          <IconButton color="primary" onClick={exportReportCsv} disabled={!selectedReport || reportData.length === 0}>
            <DownloadIcon />
          </IconButton>
        </Box>
        <Grid container spacing={3}>
          {reportList.map(({ key, label }) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Card
                elevation={1}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 2,
                  boxShadow: 1,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' },
                  minHeight: 120,
                  minWidth: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                }}
                onClick={() => handleReportClick(key)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" color="textSecondary" sx={{ fontSize: '1.1rem', fontWeight: 500, mb: 1, textAlign: 'left' }}>
                    {label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      {/* Report Details */}
      {loadingReport && <Box display="flex" justifyContent="center" mt={2}><CircularProgress /></Box>}
      {errorReport && <Alert severity="error" sx={{ mt: 2 }}>{errorReport}</Alert>}
      {selectedReport && !loadingReport && !errorReport && (
        <Box mt={4}>
          <Typography variant="h6" mb={2}>{reportConfig[selectedReport].title}</Typography>
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
      )}
    </Box>
  );
};

export default Dashboard; 