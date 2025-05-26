import React from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserContext } from './contexts/UserContext';
import { BrowserRouter } from 'react-router-dom';

// Default test theme matching the app theme
const testTheme = {
  primaryColor: 'green',
  colors: {
    green: ['#f1f8e9', '#dcedc8', '#c5e1a5', '#aed581', '#9ccc65', '#8bc34a', '#7cb342', '#689f38', '#558b2f', '#33691e'],
  },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  defaultRadius: 'md',
};

// Mock user data
export const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};

// Mock JWT token
export const mockToken = 'mock-jwt-token';

// Custom render function with all providers
export const renderWithProviders = (
  ui,
  {
    user = null,
    token = null,
    ...renderOptions
  } = {}
) => {
  const AllTheProviders = ({ children }) => {
    return (
      <GoogleOAuthProvider clientId="test-client-id">
        <MantineProvider>
          <UserContext.Provider value={{ user, token }}>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </UserContext.Provider>
        </MantineProvider>
      </GoogleOAuthProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0)); 