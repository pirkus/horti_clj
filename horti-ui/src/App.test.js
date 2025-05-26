import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser, mockToken } from './test-utils';
import App from './App';

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

// Mock components
jest.mock('./components/Login', () => {
  return function Login({ onLogin }) {
    return (
      <div data-testid="login-component">
        <button onClick={() => onLogin('mock-token')}>Mock Login</button>
      </div>
    );
  };
});

jest.mock('./components/Dashboard', () => {
  return function Dashboard() {
    return <div data-testid="dashboard-component">Dashboard</div>;
  };
});

const { jwtDecode } = require('jwt-decode');

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication Flow', () => {
    it('shows login page when not authenticated', () => {
      renderWithProviders(<App />);
      
      expect(screen.getByTestId('login-component')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-component')).not.toBeInTheDocument();
    });

    it('shows dashboard when authenticated with valid token', () => {
      localStorage.setItem('authToken', mockToken);
      jwtDecode.mockReturnValue(mockUser);
      
      renderWithProviders(<App />);
      
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
      expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
    });

    it('removes expired token and shows login', () => {
      const expiredUser = { ...mockUser, exp: Math.floor(Date.now() / 1000) - 3600 };
      localStorage.setItem('authToken', 'expired-token');
      jwtDecode.mockReturnValue(expiredUser);
      
      renderWithProviders(<App />);
      
      expect(screen.getByTestId('login-component')).toBeInTheDocument();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('handles invalid token gracefully', () => {
      localStorage.setItem('authToken', 'invalid-token');
      jwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      renderWithProviders(<App />);
      
      expect(screen.getByTestId('login-component')).toBeInTheDocument();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('Header Component', () => {
    it('shows app title', () => {
      renderWithProviders(<App />);
      
      expect(screen.getByText('🌱 Horti')).toBeInTheDocument();
    });

    it('shows user info and logout button when authenticated', () => {
      localStorage.setItem('authToken', mockToken);
      jwtDecode.mockReturnValue(mockUser);
      
      renderWithProviders(<App />);
      
      expect(screen.getByText(`Welcome, ${mockUser.name}`)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('handles logout correctly', async () => {
      const user = userEvent.setup();
      localStorage.setItem('authToken', mockToken);
      jwtDecode.mockReturnValue(mockUser);
      
      renderWithProviders(<App />);
      
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);
      
      await waitFor(() => {
        expect(localStorage.getItem('authToken')).toBeNull();
        expect(screen.getByTestId('login-component')).toBeInTheDocument();
      });
    });
  });

  describe('Login Flow', () => {
    it('handles successful login', async () => {
      const user = userEvent.setup();
      jwtDecode.mockReturnValue(mockUser);
      
      renderWithProviders(<App />);
      
      const loginButton = screen.getByText('Mock Login');
      await user.click(loginButton);
      
      await waitFor(() => {
        expect(localStorage.getItem('authToken')).toBe('mock-token');
        expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
      });
    });
  });
}); 