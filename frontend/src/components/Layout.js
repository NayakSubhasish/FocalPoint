import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  IconButton,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  People,
  Assignment,
  Logout,
  Brightness4,
  Brightness7,
  BarChart,
  AccessTime,
  CheckBox,
  CheckBoxOutlined,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo.png';

const Layout = ({ children, mode, toggleMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    ...(user && user.role === 'admin' ? [{ text: 'Users', icon: <People />, path: '/users' }] : []),
    { text: 'Projects', icon: <Assignment />, path: '/projects' },
    { text: 'Tasks', icon: <CheckBoxOutlined />, path: '/tasks' },
    { text: 'Time & Transactions', icon: <AccessTime />, path: '/time-transactions' },
  ];

  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          background: (theme) => theme.palette.mode === 'dark' ? '#181C24' : 'white',
          color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'black',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          borderBottom: '1px solid #eee',
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
            <Box component="img" src={logo} alt="FocalPoint Logo" sx={{ height: 36, width: 36, mr: 1, borderRadius: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                FocalPoint
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, letterSpacing: 0.5, color: (theme) => theme.palette.text.secondary }}>
                focus on priorities
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.text}
                color="inherit"
                startIcon={item.icon}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  fontWeight: 500,
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  borderBottom: location.pathname === item.path ? '2px solid #1976d2' : 'none',
                  borderRadius: 0,
                  px: 2,
                  minWidth: 0,
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit" onClick={toggleMode}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            {user && (
              <Chip
                label={user.role.replace('_', ' ').toUpperCase()}
                sx={{
                  bgcolor: user.role === 'admin' ? '#e0f7fa' : user.role === 'team_leader' ? '#f3e8ff' : user.role === 'project_manager' ? '#e3f2fd' : '#f5f5f5',
                  color: user.role === 'admin' ? '#00796b' : user.role === 'team_leader' ? '#7c3aed' : user.role === 'project_manager' ? '#1976d2' : '#333',
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: 2,
                  pointerEvents: 'none',
                  ml: 1,
                }}
              />
            )}
            {user && (
              <>
                <Button
                  color="inherit"
                  startIcon={<Avatar sx={{ width: 32, height: 32 }}>{user.name?.[0] || '?'}</Avatar>}
                  onClick={handleMenuOpen}
                  sx={{ textTransform: 'none', fontWeight: 500 }}
                >
                  {user.name}
                </Button>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 