import React from 'react';
import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { renderWithProviders, mockUser, mockToken } from '../../test-utils';

// Get the mocked navigate function from our mock
const { mockNavigate } = require('../../__mocks__/react-router-dom');

const mockCanvases = [
  {
    id: 1,
    name: 'Living Room Hydro',
    description: 'Main hydroponic setup',
    width: 800,
    height: 600,
    'created-at': '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Kitchen Herbs',
    description: 'Small herb garden',
    width: 600,
    height: 400,
    'created-at': '2024-02-01T10:00:00Z'
  }
];

describe('Dashboard Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('displays welcome message with user name', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });

      expect(screen.getByText('Welcome to Your Garden Dashboard')).toBeInTheDocument();
      expect(screen.getByText(`Hello ${mockUser.name}! Manage your plants and track your gardening journey.`)).toBeInTheDocument();
    });

    it('fetches canvases on mount', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockCanvases,
      });

      renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/canvases', {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        });
      });
    });
  });

  describe('Canvas Display', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockCanvases,
      });
    });

    it('displays existing canvases', async () => {
      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('🏡 Your Gardens')).toBeInTheDocument();
        expect(screen.getByText('Living Room Hydro')).toBeInTheDocument();
        expect(screen.getByText('Main hydroponic setup')).toBeInTheDocument();
        expect(screen.getByText('Kitchen Herbs')).toBeInTheDocument();
        expect(screen.getByText('Small herb garden')).toBeInTheDocument();
      });
    });

    it('displays canvas dimensions', async () => {
      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('800×600')).toBeInTheDocument();
        expect(screen.getByText('600×400')).toBeInTheDocument();
      });
    });

    it('navigates to canvas when clicking Open Garden', async () => {
      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Living Room Hydro')).toBeInTheDocument();
      });

      const openButtons = screen.getAllByRole('button', { name: /Open Garden/i });
      await user.click(openButtons[0]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/canvas/1');
      });
    });
  });

  describe('Action Cards', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    });

    it('displays action cards', async () => {
      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Garden')).toBeInTheDocument();
        expect(screen.getByText('Set up a new hydroponic growing area')).toBeInTheDocument();
        expect(screen.getByText('My Plants')).toBeInTheDocument();
        expect(screen.getByText('View and manage your plant collection')).toBeInTheDocument();
      });
    });

    it('navigates to plants page when clicking View Plants', async () => {
      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('My Plants')).toBeInTheDocument();
      });

      const viewPlantsButton = screen.getByRole('button', { name: /View Plants/i });
      await user.click(viewPlantsButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/plants');
      });
    });
  });

  describe('Create Garden Modal', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    });

    it('opens create garden modal', async () => {
      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Garden')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Garden/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g., Living Room Hydro, Kitchen Herbs')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Describe this growing setup...')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Garden Modal', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockCanvases,
      });
    });

    it('opens edit modal with canvas data', async () => {
      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Living Room Hydro')).toBeInTheDocument();
      });

      // Find and click the menu button for the first canvas
      const menuButtons = screen.getAllByRole('button', { name: '' });
      const firstMenuButton = menuButtons.find(btn => 
        btn.closest('.mantine-Card-root')?.textContent?.includes('Living Room Hydro')
      );
      await user.click(firstMenuButton);

      // Click Edit Garden in the menu
      await waitFor(() => {
        expect(screen.getByText('Edit Garden')).toBeInTheDocument();
      });
      
      const editMenuItem = screen.getByText('Edit Garden');
      await user.click(editMenuItem);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Garden: Living Room Hydro')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Living Room Hydro')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Main hydroponic setup')).toBeInTheDocument();
        expect(screen.getByDisplayValue('800')).toBeInTheDocument();
      });
    });

    it('updates garden successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockCanvases[0], name: 'Updated Garden' }),
      });

      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Living Room Hydro')).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button', { name: '' });
      const firstMenuButton = menuButtons.find(btn => 
        btn.closest('.mantine-Card-root')?.textContent?.includes('Living Room Hydro')
      );
      await user.click(firstMenuButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Garden')).toBeInTheDocument();
      });

      const editMenuItem = screen.getByText('Edit Garden');
      await user.click(editMenuItem);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Living Room Hydro');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Garden Name');

      const updateButton = screen.getByRole('button', { name: /Update Garden/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/canvases/1', expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          },
          body: JSON.stringify({
            name: 'Updated Garden Name',
            description: 'Main hydroponic setup',
            width: 800,
            height: 600
          })
        }));
      });
    });
  });

  describe('Archive Garden Modal', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockCanvases,
      });
    });

    it('opens archive confirmation modal', async () => {
      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Living Room Hydro')).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button', { name: '' });
      const firstMenuButton = menuButtons.find(btn => 
        btn.closest('.mantine-Card-root')?.textContent?.includes('Living Room Hydro')
      );
      await user.click(firstMenuButton);

      await waitFor(() => {
        expect(screen.getByText('Archive Garden')).toBeInTheDocument();
      });

      const archiveMenuItem = screen.getByText('Archive Garden');
      await user.click(archiveMenuItem);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to archive/)).toBeInTheDocument();
        expect(screen.getByText('Living Room Hydro', { selector: 'strong' })).toBeInTheDocument();
      });
    });

    it('archives garden successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await act(async () => {
        renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Living Room Hydro')).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button', { name: '' });
      const firstMenuButton = menuButtons.find(btn => 
        btn.closest('.mantine-Card-root')?.textContent?.includes('Living Room Hydro')
      );
      await user.click(firstMenuButton);

      await waitFor(() => {
        expect(screen.getByText('Archive Garden')).toBeInTheDocument();
      });

      const archiveMenuItem = screen.getByText('Archive Garden');
      await user.click(archiveMenuItem);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const archiveButton = screen.getByRole('button', { name: /Archive Garden/i });
      await user.click(archiveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/canvases/1/archive', expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ archived: true })
        }));
      });
    });
  });

  describe('Usage Tips', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    });

    it('displays garden usage tips', async () => {
      renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });

      await waitFor(() => {
        expect(screen.getByText('Garden Usage Tips 🎯')).toBeInTheDocument();
        expect(screen.getByText(/Add Plants:/)).toBeInTheDocument();
        expect(screen.getByText(/Log Metrics:/)).toBeInTheDocument();
        expect(screen.getByText(/Track Growth:/)).toBeInTheDocument();
        expect(screen.getByText(/Daily Routine:/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error when fetching canvases fails', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<Dashboard />, { user: mockUser, token: mockToken });

      await waitFor(() => {
        expect(screen.getByText('Error connecting to server')).toBeInTheDocument();
      });
    });
  });
}); 