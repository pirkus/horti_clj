import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, AppShell, Container, Group, Text, Button } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PlantList from './components/PlantList';
import GardenLogs from './components/GardenLogs';
import GardenCanvas from './components/GardenCanvas';
import { UserContext } from './contexts/UserContext';

const theme = {
  primaryColor: 'green',
  colors: {
    green: ['#f1f8e9', '#dcedc8', '#c5e1a5', '#aed581', '#9ccc65', '#8bc34a', '#7cb342', '#689f38', '#558b2f', '#33691e'],
  },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  defaultRadius: 'md',
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp > currentTime) {
          setUser(decoded);
        } else {
          // Token expired
          localStorage.removeItem('authToken');
          setToken(null);
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('authToken');
        setToken(null);
      }
    }
  }, [token]);

  const handleLogin = (googleToken) => {
    localStorage.setItem('authToken', googleToken);
    setToken(googleToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return (
    <GoogleOAuthProvider clientId="96361216057-f2bbdvmomo6hqbt5sedmlgbeeud8feg7.apps.googleusercontent.com">
      <MantineProvider theme={theme}>
        <DatesProvider>
          <UserContext.Provider value={{ user, token }}>
            <Router>
              <AppShell header={{ height: 60 }} padding="md">
                <AppShell.Header>
                  <Group justify="space-between" h="100%" px="md">
                    <Text size="xl" fw={600}>
                      🌱 Horti - Your Garden Companion
                    </Text>
                    {user && (
                      <Group>
                        <Text size="sm" c="dimmed">
                          Welcome, {user.name || user.email}
                        </Text>
                        <Button variant="light" onClick={handleLogout}>
                          Logout
                        </Button>
                      </Group>
                    )}
                  </Group>
                </AppShell.Header>

                <AppShell.Main>
                  <Container size="lg">
                    <Routes>
                      <Route 
                        path="/login" 
                        element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
                      />
                      <Route 
                        path="/" 
                        element={user ? <Dashboard /> : <Navigate to="/login" />} 
                      />
                      <Route 
                        path="/canvas" 
                        element={user ? <GardenCanvas /> : <Navigate to="/login" />} 
                      />
                      <Route 
                        path="/plants" 
                        element={user ? <PlantList /> : <Navigate to="/login" />} 
                      />
                      <Route 
                        path="/logs" 
                        element={user ? <GardenLogs /> : <Navigate to="/login" />} 
                      />
                    </Routes>
                  </Container>
                </AppShell.Main>
              </AppShell>
            </Router>
          </UserContext.Provider>
        </DatesProvider>
      </MantineProvider>
    </GoogleOAuthProvider>
  );
}

export default App; 