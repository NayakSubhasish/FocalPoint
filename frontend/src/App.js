import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ProjectManagement from './pages/ProjectManagement';
import TaskManagement from './pages/TaskManagement';
import TimeTransactions from './pages/TimeTransactions';
import { useMediaQuery } from '@mui/material';

function App() {
  const [mode, setMode] = useState('light');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: more)');
  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  const theme = useMemo(
    () =>
      createTheme({
        spacing: 4,
        palette: {
          mode,
          primary: { main: '#1976d2' },
          secondary: { main: '#ff4081' },
          background: { default: mode === 'light' ? '#f4f6f8' : '#121212' },
          ...(prefersHighContrast && {
            primary: { main: '#ffffff' },
            secondary: { main: '#ffffff' },
            background: { default: '#000000' },
            text: { primary: '#ffffff' },
          }),
        },
        shape: { borderRadius: 8 },
        typography: {
          fontFamily: 'Inter, Arial, sans-serif',
          h5: { fontWeight: 600, letterSpacing: '0.5px', fontSize: '1.5rem' },
          h6: { fontWeight: 500, letterSpacing: '0.4px', fontSize: '1.25rem' },
          body1: { fontSize: '1rem', letterSpacing: '0.3px' },
          button: { textTransform: 'none', letterSpacing: '0.75px' },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
              },
            },
          },
        },
      }),
    [mode, prefersHighContrast]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout mode={mode} toggleMode={toggleMode}>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route 
                        path="/users" 
                        element={
                          <ProtectedRoute requiredRoles={['admin']}>
                            <UserManagement />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/projects" 
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'project_manager', 'team_leader', 'team_member']}>
                            <ProjectManagement />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/tasks" 
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'project_manager', 'team_member', 'team_leader']}>
                            <TaskManagement />
                          </ProtectedRoute>
                        } 
                      />
                      <Route
                        path="/time-transactions"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'project_manager', 'team_member', 'team_leader']}>
                            <TimeTransactions />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
