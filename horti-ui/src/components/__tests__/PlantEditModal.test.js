import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlantEditModal from '../PlantEditModal';
import { renderWithProviders, mockUser, mockToken } from '../../test-utils';

const mockPlant = {
  id: 1,
  name: 'Tomato Plant',
  emoji: '🍅'
};

describe('PlantEditModal Component', () => {
  const user = userEvent.setup();
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('Modal Display', () => {
    it('does not render when closed', () => {
      renderWithProviders(
        <PlantEditModal 
          opened={false} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders modal with plant data when opened', () => {
      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Plant - Tomato Plant')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tomato Plant')).toBeInTheDocument();
      // Use getAllByDisplayValue for Select component which creates multiple inputs
      const emojiInputs = screen.getAllByDisplayValue('🍅');
      expect(emojiInputs.length).toBeGreaterThan(0);
    });

    it('displays form fields correctly', () => {
      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      // Use more flexible queries for required fields with asterisks
      expect(screen.getByText(/Plant Name/)).toBeInTheDocument();
      expect(screen.getByText(/Plant Emoji/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when name is empty', async () => {
      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const nameInput = screen.getByPlaceholderText('Enter plant name');
      await user.clear(nameInput);
      
      // Type spaces to trigger validation (spaces will be trimmed)
      await user.type(nameInput, '   ');

      // Check for inline error message
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      // Save button should be disabled
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows error when emoji is not selected', async () => {
      const plantWithoutEmoji = { ...mockPlant, emoji: '' };
      
      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={plantWithoutEmoji} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      // Check for inline error message on the Select component
      await waitFor(() => {
        expect(screen.getByText('Emoji is required')).toBeInTheDocument();
      });
      
      // Save button should be disabled
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('disables save button when form is invalid', () => {
      const plantWithoutEmoji = { ...mockPlant, emoji: '' };
      
      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={plantWithoutEmoji} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Form Interaction', () => {
    it('updates plant name', async () => {
      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const nameInput = screen.getByPlaceholderText('Enter plant name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Cherry Tomato');

      expect(screen.getByDisplayValue('Cherry Tomato')).toBeInTheDocument();
    });

    it('updates plant emoji from dropdown', async () => {
      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const emojiSelect = screen.getByPlaceholderText('Choose an emoji');
      await user.click(emojiSelect);
      
      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByText('🌿')).toBeInTheDocument();
      });
      
      // Select a different emoji from the dropdown
      const basilOption = screen.getByText('🌿');
      await user.click(basilOption);

      // Check that the value changed - use getAllByDisplayValue
      await waitFor(() => {
        const emojiInputs = screen.getAllByDisplayValue('🌿');
        expect(emojiInputs.length).toBeGreaterThan(0);
      });
    });

    it('provides common emoji options', async () => {
      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const emojiSelect = screen.getByPlaceholderText('Choose an emoji');
      await user.click(emojiSelect);

      // Wait for dropdown to open
      await waitFor(() => {
        // Check for some common emojis
        expect(screen.getByText('🍅')).toBeInTheDocument();
        expect(screen.getByText('🥬')).toBeInTheDocument();
        expect(screen.getByText('🌿')).toBeInTheDocument();
        expect(screen.getByText('🌶️')).toBeInTheDocument();
        expect(screen.getByText('🥕')).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('saves changes successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockPlant, name: 'Updated Plant' }),
      });

      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const nameInput = screen.getByPlaceholderText('Enter plant name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Plant');

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/plants/1', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          },
          body: JSON.stringify({
            name: 'Updated Plant',
            emoji: '🍅'
          })
        });
      });

      expect(mockOnUpdate).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows loading state while saving', async () => {
      global.fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      // Check for loading state
      expect(saveButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    });

    it('handles save error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update plant')).toBeInTheDocument();
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('handles network error', async () => {
      // Create fresh mocks for this test
      const localMockOnUpdate = jest.fn();
      const localMockOnClose = jest.fn();
      
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={localMockOnClose} 
          plant={mockPlant} 
          onUpdate={localMockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      // Wait for the error message to appear
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Error updating plant');
      });

      // Verify callbacks were not called
      expect(localMockOnUpdate).not.toHaveBeenCalled();
      expect(localMockOnClose).not.toHaveBeenCalled();
      
      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cancel Functionality', () => {
    it('closes modal on cancel', async () => {
      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnUpdate).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('clears error on close', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      // Trigger an error
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update plant')).toBeInTheDocument();
      });

      // Close modal
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Form State Management', () => {
    it('resets form when plant prop changes', () => {
      const { rerender } = renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      expect(screen.getByDisplayValue('Tomato Plant')).toBeInTheDocument();

      const newPlant = { id: 2, name: 'Basil', emoji: '🌿' };
      rerender(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={newPlant} 
          onUpdate={mockOnUpdate} 
        />
      );

      expect(screen.getByDisplayValue('Basil')).toBeInTheDocument();
      // For Select components, check that the emoji value is present
      const emojiInputs = screen.getAllByDisplayValue('🌿');
      expect(emojiInputs.length).toBeGreaterThan(0);
    });

    it('trims whitespace from plant name', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockPlant }),
      });

      renderWithProviders(
        <PlantEditModal 
          opened={true} 
          onClose={mockOnClose} 
          plant={mockPlant} 
          onUpdate={mockOnUpdate} 
        />,
        { user: mockUser, token: mockToken }
      );

      const nameInput = screen.getByPlaceholderText('Enter plant name');
      await user.clear(nameInput);
      await user.type(nameInput, '  Spaced Plant Name  ');

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/plants/1', expect.objectContaining({
          body: JSON.stringify({
            name: 'Spaced Plant Name',
            emoji: '🍅'
          })
        }));
      });
    });
  });
}); 