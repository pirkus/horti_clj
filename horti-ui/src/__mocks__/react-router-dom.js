import React from 'react';

// Mock for react-router-dom
const mockNavigate = jest.fn();

module.exports = {
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Navigate: ({ to }) => {
    return `Navigate to ${to}`;
  },
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
};

// Export the mock navigate function so tests can access it
module.exports.mockNavigate = mockNavigate; 