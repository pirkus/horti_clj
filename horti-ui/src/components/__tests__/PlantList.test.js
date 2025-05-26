import React from 'react';
import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlantList from '../PlantList';
import { renderWithProviders, mockUser, mockToken } from '../../test-utils';

// Mock PlantEditModal component
jest.mock('../PlantEditModal', () => {
  return function PlantEditModal({ opened, onClose, plant, onUpdate }) {
    if (!opened) return null;
    return (
      <div data-testid="plant-edit-modal">
        <h2>Edit {plant?.name}</h2>
        <button onClick={() => { onUpdate(); onClose(); }}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

const mockPlants = [
  {
    id: 1,
    name: 'Tomato Plant',
    species: 'Solanum lycopersicum',
    plantingDate: '2024-01-15',
    notes: 'Growing well',
    'canvas-id': 1,
    emoji: '🍅'
  },
  {
    id: 2,
    name: 'Basil',
    species: 'Ocimum basilicum',
    plantingDate: '2024-02-01',
    notes: 'Needs more water',
    'canvas-id': 1,
    emoji: '🌿'
  },
  {
    id: 3,
    name: 'Sunflower',
    type: 'Helianthus annuus',
    'planting-date': '2024-03-01',
    canvasId: 2,
    emoji: '🌻'
  }
];

const mockCanvases = [
  { id: 1, name: 'Vegetable Garden' },
  { id: 2, name: 'Flower Bed' }
];

describe('PlantList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Loading', () => {
    it('shows loading state initially', () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
      renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      
      expect(screen.getByText('Loading plants...')).toBeInTheDocument();
    });

    it('fetches plants and canvases on mount', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPlants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCanvases,
        });

      renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/plants', expect.objectContaining({
          headers: { 'Authorization': `Bearer ${mockToken}` }
        }));
        expect(global.fetch).toHaveBeenCalledWith('/api/canvases', expect.objectContaining({
          headers: { 'Authorization': `Bearer ${mockToken}` }
        }));
      });
    });
  });

  describe('Plant Display', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPlants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCanvases,
        });
    });

    it('displays plants grouped by garden', async () => {
      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      // Wait for the main title to appear
      await waitFor(() => {
        expect(screen.getByText('🌱 My Plants')).toBeInTheDocument();
      });

      // Wait for gardens to appear
      await waitFor(() => {
        expect(screen.getByText('Vegetable Garden')).toBeInTheDocument();
        expect(screen.getByText('Flower Bed')).toBeInTheDocument();
      });

      // Wait for plant cards to render - use more flexible queries
      await waitFor(() => {
        // Look for plant names in the document
        const tomatoElements = screen.getAllByText((content, element) => {
          return content === 'Tomato Plant' && element?.tagName !== 'SCRIPT';
        });
        expect(tomatoElements.length).toBeGreaterThan(0);
      });

      // Check for other plants
      await waitFor(() => {
        expect(screen.getByText('Basil')).toBeInTheDocument();
        expect(screen.getByText('Sunflower')).toBeInTheDocument();
      });
    });

    it('displays plant details correctly', async () => {
      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('🌱 My Plants')).toBeInTheDocument();
      });

      // Wait for plant cards to fully render
      await waitFor(() => {
        expect(screen.getByText('Tomato Plant')).toBeInTheDocument();
      });

      // Check tomato plant details
      expect(screen.getByText('🍅')).toBeInTheDocument();
      expect(screen.getByText('Species: Solanum lycopersicum')).toBeInTheDocument();
      expect(screen.getByText('Growing well')).toBeInTheDocument();
      
      // Check that planted dates are shown
      const plantedDates = screen.getAllByText(/Planted: /);
      expect(plantedDates.length).toBeGreaterThan(0);
    });

    it('shows empty state when no plants exist', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCanvases,
        });

      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('No plants yet!')).toBeInTheDocument();
        expect(screen.getByText(/Start your garden by adding your first plant/)).toBeInTheDocument();
      });
    });

    it('displays plant count badges', async () => {
      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('🌱 My Plants')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('2 plants')).toBeInTheDocument(); // Vegetable Garden
        expect(screen.getByText('1 plant')).toBeInTheDocument(); // Flower Bed
      });
    });
  });

  describe('Add Plant Modal', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPlants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCanvases,
        });
    });

    it('opens add plant modal when clicking add button', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('🌱 My Plants')).toBeInTheDocument();
      });

      // Find the floating action button - it has a specific style and contains IconPlus
      const allButtons = screen.getAllByRole('button');
      const addButton = allButtons.find(btn => {
        // Check if it's the FAB by its style attributes
        const style = btn.getAttribute('style');
        return style && style.includes('position: fixed') && style.includes('bottom: 20');
      });

      expect(addButton).toBeTruthy();
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Plant')).toBeInTheDocument();
        expect(screen.getByLabelText('Plant Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Species')).toBeInTheDocument();
        expect(screen.getByLabelText('Planting Date')).toBeInTheDocument();
        expect(screen.getByLabelText('Notes')).toBeInTheDocument();
      });
    });

    it('adds a new plant successfully', async () => {
      const user = userEvent.setup();
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 4, name: 'New Plant' }),
      });

      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('🌱 My Plants')).toBeInTheDocument();
      });

      // Find the FAB button
      const allButtons = screen.getAllByRole('button');
      const addButton = allButtons.find(btn => {
        const style = btn.getAttribute('style');
        return style && style.includes('position: fixed') && style.includes('bottom: 20');
      });

      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Plant')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('Plant Name'), 'Cucumber');
      await user.type(screen.getByLabelText('Species'), 'Cucumis sativus');
      await user.type(screen.getByLabelText('Planting Date'), '2024-04-01');
      await user.type(screen.getByLabelText('Notes'), 'Planted in greenhouse');

      const submitButton = screen.getByRole('button', { name: 'Add Plant' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/plants', expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          },
          body: JSON.stringify({
            name: 'Cucumber',
            species: 'Cucumis sativus',
            plantingDate: '2024-04-01',
            notes: 'Planted in greenhouse'
          })
        }));
      });
    });

    it('closes modal on cancel', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('🌱 My Plants')).toBeInTheDocument();
      });

      // Find the FAB button
      const allButtons = screen.getAllByRole('button');
      const addButton = allButtons.find(btn => {
        const style = btn.getAttribute('style');
        return style && style.includes('position: fixed') && style.includes('bottom: 20');
      });

      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Plant')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Add New Plant')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Plant', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPlants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCanvases,
        });
    });

    it('opens delete confirmation modal', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Tomato Plant')).toBeInTheDocument();
      });

      // Find delete button for Tomato Plant
      const tomatoCard = screen.getByText('Tomato Plant').closest('.mantine-Card-root');
      const deleteButton = within(tomatoCard).getAllByRole('button')[1]; // Second button is delete
      
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
        expect(screen.getByText('Tomato Plant', { selector: 'b' })).toBeInTheDocument();
      });
    });

    it('requires plant name confirmation for deletion', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Tomato Plant')).toBeInTheDocument();
      });

      const tomatoCard = screen.getByText('Tomato Plant').closest('.mantine-Card-root');
      const deleteButton = within(tomatoCard).getAllByRole('button')[1];
      
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      });

      const deleteConfirmButton = screen.getByRole('button', { name: 'Delete Plant' });
      expect(deleteConfirmButton).toBeDisabled();

      const confirmInput = screen.getByPlaceholderText('Plant name');
      await user.type(confirmInput, 'Tomato Plant');

      await waitFor(() => {
        expect(deleteConfirmButton).toBeEnabled();
      });
    });

    it('deletes plant successfully', async () => {
      const user = userEvent.setup();
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Tomato Plant')).toBeInTheDocument();
      });

      const tomatoCard = screen.getByText('Tomato Plant').closest('.mantine-Card-root');
      const deleteButton = within(tomatoCard).getAllByRole('button')[1];
      
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      });

      const confirmInput = screen.getByPlaceholderText('Plant name');
      await user.type(confirmInput, 'Tomato Plant');

      const deleteConfirmButton = screen.getByRole('button', { name: 'Delete Plant' });
      await user.click(deleteConfirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/plants/1', expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          }
        }));
      });
    });
  });

  describe('Edit Plant', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPlants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCanvases,
        });
    });

    it('opens edit modal when clicking edit button', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Tomato Plant')).toBeInTheDocument();
      });

      const tomatoCard = screen.getByText('Tomato Plant').closest('.mantine-Card-root');
      const editButton = within(tomatoCard).getAllByRole('button')[0]; // First button is edit
      
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('plant-edit-modal')).toBeInTheDocument();
        expect(screen.getByText('Edit Tomato Plant')).toBeInTheDocument();
      });
    });

    it('refreshes plant list after successful edit', async () => {
      const user = userEvent.setup();
      
      // Mock the refresh fetch
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPlants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCanvases,
        });

      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Tomato Plant')).toBeInTheDocument();
      });

      const tomatoCard = screen.getByText('Tomato Plant').closest('.mantine-Card-root');
      const editButton = within(tomatoCard).getAllByRole('button')[0];
      
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('plant-edit-modal')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        // Should refetch plants
        expect(global.fetch).toHaveBeenCalledWith('/api/plants', expect.any(Object));
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error when fetching plants fails', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('Error connecting to server')).toBeInTheDocument();
      });
    });

    it('displays error when adding plant fails', async () => {
      const user = userEvent.setup();
      
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPlants,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCanvases,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

      await act(async () => {
        renderWithProviders(<PlantList />, { user: mockUser, token: mockToken });
      });

      await waitFor(() => {
        expect(screen.getByText('🌱 My Plants')).toBeInTheDocument();
      });

      // Find the FAB button
      const allButtons = screen.getAllByRole('button');
      const addButton = allButtons.find(btn => {
        const style = btn.getAttribute('style');
        return style && style.includes('position: fixed') && style.includes('bottom: 20');
      });

      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Plant')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('Plant Name'), 'Test Plant');
      
      const submitButton = screen.getByRole('button', { name: 'Add Plant' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to add plant')).toBeInTheDocument();
      });
    });
  });
}); 