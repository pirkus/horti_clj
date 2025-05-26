import React, { useState, useContext, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Alert,
} from '@mantine/core';
import { IconEdit, IconAlertCircle } from '@tabler/icons-react';
import { UserContext } from '../contexts/UserContext';

const PlantEditModal = ({ opened, onClose, plant, onUpdate }) => {
  const [editData, setEditData] = useState({
    name: '',
    emoji: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useContext(UserContext);

  const commonEmojis = [
    '🍅', '🥬', '🌿', '🌶️', '🥕', '🥒', '🌱', '🌸', '🌾', 
    '🌽', '🫑', '🥦', '🧄', '🧅', '🍓', '🫐', '🥝', '🍇', 
    '🍊', '🍋', '🥑', '🍆', '🥔', '🌻', '🌹', '🌺', '🌷'
  ];

  // Initialize form data when plant changes
  useEffect(() => {
    if (plant) {
      setEditData({
        name: plant.name || '',
        emoji: plant.emoji || ''
      });
      setError(null);
    }
  }, [plant]);

  const handleSave = async () => {
    if (!editData.name.trim()) {
      setError('Plant name is required');
      return;
    }

    if (!editData.emoji) {
      setError('Plant emoji is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/plants/${plant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editData.name.trim(),
          emoji: editData.emoji
        }),
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        setError('Failed to update plant');
      }
    } catch (err) {
      setError('Error updating plant');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const isValid = editData.name.trim() && editData.emoji;

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose} 
      title={`Edit Plant - ${plant?.name}`}
      size="md"
    >
      <Stack spacing="md">
        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        <TextInput
          label="Plant Name"
          placeholder="Enter plant name"
          required
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          error={!editData.name.trim() && editData.name !== '' ? 'Name is required' : null}
        />

        <Select
          label="Plant Emoji"
          placeholder="Choose an emoji"
          required
          value={editData.emoji}
          onChange={(value) => setEditData({ ...editData, emoji: value || '' })}
          data={commonEmojis.map((emoji) => ({
            value: emoji,
            label: emoji
          }))}
          searchable
          size="md"
          error={!editData.emoji ? 'Emoji is required' : null}
        />

        <Group justify="flex-end" mt="md">
          <Button 
            variant="default" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isValid || loading}
            loading={loading}
            leftSection={<IconEdit size={16} />}
          >
            Save Changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default PlantEditModal; 