import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Text,
  Button,
  Modal,
  TextInput,
  Grid,
  Alert,
  Card,
  Group,
  Stack,
  ActionIcon,
  Textarea,
  Center,
  Divider,
  Badge,
} from '@mantine/core';
import { IconPlus, IconPlant, IconTrash, IconHome, IconEdit } from '@tabler/icons-react';
import { UserContext } from '../contexts/UserContext';
import PlantEditModal from './PlantEditModal';

const PlantList = () => {
  const [plants, setPlants] = useState([]);
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState(null);
  const [plantToEdit, setPlantToEdit] = useState(null);
  const [confirmPlantName, setConfirmPlantName] = useState('');
  const [newPlant, setNewPlant] = useState({
    name: '',
    species: '',
    plantingDate: '',
    notes: ''
  });
  const { token } = useContext(UserContext);

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/plants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlants(data);
      } else {
        setError('Failed to fetch plants');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  const fetchCanvases = async () => {
    try {
      const response = await fetch('/api/canvases', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCanvases(data);
      } else {
        setError('Failed to fetch canvases');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  useEffect(() => {
    if (token) {
      Promise.all([fetchPlants(), fetchCanvases()])
        .finally(() => setLoading(false));
    }
  }, [token]);

  // Group plants by garden
  const groupPlantsByGarden = () => {
    const gardenMap = canvases.reduce((acc, canvas) => {
      acc[canvas.id] = canvas.name;
      return acc;
    }, {});

    const grouped = plants.reduce((acc, plant) => {
      const gardenId = plant.canvasId || plant['canvas-id'] || 'unassigned';
      const gardenName = gardenMap[gardenId] || 'Unassigned Plants';
      
      if (!acc[gardenName]) {
        acc[gardenName] = [];
      }
      acc[gardenName].push(plant);
      return acc;
    }, {});

    return grouped;
  };

  const handleAddPlant = async () => {
    try {
      const response = await fetch('/api/plants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPlant),
      });

      if (response.ok) {
        setOpen(false);
        setNewPlant({ name: '', species: '', plantingDate: '', notes: '' });
        fetchPlants(); // Refresh the list
      } else {
        setError('Failed to add plant');
      }
    } catch (err) {
      setError('Error adding plant');
    }
  };

  const handleDeletePlant = async () => {
    if (!plantToDelete || confirmPlantName !== plantToDelete.name) {
      setError('Plant name does not match');
      return;
    }

    try {
      const response = await fetch(`/api/plants/${plantToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDeleteModalOpen(false);
        setPlantToDelete(null);
        setConfirmPlantName('');
        fetchPlants(); // Refresh the list
      } else {
        setError('Failed to delete plant');
      }
    } catch (err) {
      setError('Error deleting plant');
    }
  };

  const openDeleteModal = (plant) => {
    setPlantToDelete(plant);
    setConfirmPlantName('');
    setDeleteModalOpen(true);
  };

  const openEditModal = (plant) => {
    setPlantToEdit(plant);
    setEditModalOpen(true);
  };

  const handlePlantUpdated = () => {
    fetchPlants(); // Refresh the plant list
  };

  const renderPlantCard = (plant) => (
    <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={plant.id}>
      <Card shadow="md" padding="lg">
        <Group mb="md" align="center" justify="space-between">
          <Group>
            <Text size="xl">{plant.emoji || '🌱'}</Text>
            <Text size="lg" fw={600}>
              {plant.name}
            </Text>
          </Group>
          <Group spacing="xs">
            <ActionIcon 
              color="blue" 
              onClick={() => openEditModal(plant)}
              variant="light"
            >
              <IconEdit size={18} />
            </ActionIcon>
            <ActionIcon 
              color="red" 
              onClick={() => openDeleteModal(plant)}
              variant="light"
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Group>
        <Stack spacing="xs">
          <Text c="dimmed" size="sm">
            Species: {plant.species || plant.type || 'Unknown'}
          </Text>
          {(plant.plantingDate || plant['planting-date']) && (
            <Text c="dimmed" size="sm">
              Planted: {new Date(plant.plantingDate || plant['planting-date']).toLocaleDateString()}
            </Text>
          )}
          {plant.notes && (
            <Text size="sm">
              {plant.notes}
            </Text>
          )}
        </Stack>
      </Card>
    </Grid.Col>
  );

  if (loading) return <Text>Loading plants...</Text>;

  const groupedPlants = groupPlantsByGarden();
  const hasPlants = plants.length > 0;

  return (
    <Box>
      <Paper shadow="md" p="xl" mb="xl">
        <Text size="xl" fw={700} c="teal" mb="sm">
          🌱 My Plants
        </Text>
        <Text c="dimmed">
          Manage your plant collection and track their growth across all gardens
        </Text>
      </Paper>

      {error && (
        <Alert color="red" mb="lg">
          {error}
        </Alert>
      )}

      {hasPlants ? (
        <Stack spacing="xl">
          {Object.entries(groupedPlants).map(([gardenName, gardenPlants]) => (
            <Box key={gardenName}>
              <Paper shadow="sm" p="md" mb="md" style={{ backgroundColor: '#f8f9fa' }}>
                <Group align="center" spacing="md">
                  <IconHome size={20} style={{ color: '#20c997' }} />
                  <Text size="lg" fw={600} c="teal">
                    {gardenName}
                  </Text>
                  <Badge variant="light" color="teal" size="sm">
                    {gardenPlants.length} plant{gardenPlants.length !== 1 ? 's' : ''}
                  </Badge>
                </Group>
              </Paper>
              
              <Grid>
                {gardenPlants.map(renderPlantCard)}
              </Grid>
              
              {Object.keys(groupedPlants).indexOf(gardenName) < Object.keys(groupedPlants).length - 1 && (
                <Divider my="xl" />
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        <Paper shadow="md" p="xl" mt="xl">
          <Center>
            <Stack align="center" spacing="md">
              <IconPlant size={60} style={{ color: '#aed581' }} />
              <Text size="lg" fw={600}>
                No plants yet!
              </Text>
              <Text c="dimmed" ta="center">
                Start your garden by adding your first plant or create plants directly in your gardens.
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}

      <ActionIcon
        color="teal"
        size="xl"
        variant="filled"
        style={{ 
          position: 'fixed', 
          bottom: 20, 
          right: 20,
          width: 60,
          height: 60,
          zIndex: 1000
        }}
        onClick={() => setOpen(true)}
      >
        <IconPlus size={28} />
      </ActionIcon>

      <Modal opened={open} onClose={() => setOpen(false)} title="Add New Plant" size={{ base: 'full', sm: 'md' }}>
        <Stack spacing="md">
          <TextInput
            label="Plant Name"
            value={newPlant.name}
            onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
          />
          <TextInput
            label="Species"
            value={newPlant.species}
            onChange={(e) => setNewPlant({ ...newPlant, species: e.target.value })}
          />
          <TextInput
            label="Planting Date"
            type="date"
            value={newPlant.plantingDate}
            onChange={(e) => setNewPlant({ ...newPlant, plantingDate: e.target.value })}
          />
          <Textarea
            label="Notes"
            rows={3}
            value={newPlant.notes}
            onChange={(e) => setNewPlant({ ...newPlant, notes: e.target.value })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPlant}>Add Plant</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
        size={{ base: 'full', sm: 'md' }}
      >
        <Stack spacing="md">
          <Text>
            Are you sure you want to delete <b>{plantToDelete?.name}</b>?
          </Text>
          <Text size="sm">
            This action cannot be undone. To confirm, please type the plant name below:
          </Text>
          <TextInput
            placeholder="Plant name"
            value={confirmPlantName}
            onChange={(e) => setConfirmPlantName(e.target.value)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeletePlant}
              disabled={confirmPlantName !== plantToDelete?.name}
            >
              Delete Plant
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Plant Edit Modal */}
      <PlantEditModal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        plant={plantToEdit}
        onUpdate={handlePlantUpdated}
      />
    </Box>
  );
};

export default PlantList; 