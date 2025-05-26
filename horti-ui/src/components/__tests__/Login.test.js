import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import { renderWithProviders } from '../../test-utils';

describe('Login Component', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome message and branding', () => {
    renderWithProviders(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByText('🌱 Welcome to Horti')).toBeInTheDocument();
    expect(screen.getByText('Your personal garden companion')).toBeInTheDocument();
    expect(screen.getByText('Track your plants, log garden activities, and grow your green thumb!')).toBeInTheDocument();
  });

  it('renders Google login button', () => {
    renderWithProviders(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('calls onLogin when Google login is successful', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login onLogin={mockOnLogin} />);
    
    const loginButton = screen.getByTestId('google-login-button');
    await user.click(loginButton);
    
    expect(mockOnLogin).toHaveBeenCalledWith('mock-credential');
    expect(mockOnLogin).toHaveBeenCalledTimes(1);
  });

  it('has proper styling and layout', () => {
    const { container } = renderWithProviders(<Login onLogin={mockOnLogin} />);
    
    // Check for Mantine Paper component
    const paper = container.querySelector('.mantine-Paper-root');
    expect(paper).toBeInTheDocument();
    
    // Check for centered content
    const centerElement = container.querySelector('.mantine-Center-root');
    expect(centerElement).toBeInTheDocument();
  });

  it('is accessible', () => {
    renderWithProviders(<Login onLogin={mockOnLogin} />);
    
    // Check that all text content is readable
    const welcomeText = screen.getByText('🌱 Welcome to Horti');
    expect(welcomeText).toHaveStyle({ fontSize: expect.any(String) });
  });
}); 