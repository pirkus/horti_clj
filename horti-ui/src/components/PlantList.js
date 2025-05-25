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
} from '@mantine/core';
import { IconPlus, IconPlant } from '@tabler/icons-react';
import { UserContext } from '../contexts/UserContext';

const PlantList = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPlants();
    }
  }, [token]);

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

  if (loading) return <Text>Loading plants...</Text>;

  return (
    <Box>
      <Paper shadow="md" p="xl" mb="xl">
        <Text size="xl" fw={700} c="teal" mb="sm">
          🌱 My Plants
        </Text>
        <Text c="dimmed">
          Manage your plant collection and track their growth
        </Text>
      </Paper>

      {error && (
        <Alert color="red" mb="lg">
          {error}
        </Alert>
      )}

      <Grid>
        {plants.map((plant) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={plant.id}>
            <Card shadow="md" padding="lg">
              <Group mb="md" align="center">
                <IconPlant size={24} style={{ color: '#20c997' }} />
                <Text size="lg" fw={600}>
                  {plant.name}
                </Text>
              </Group>
              <Stack spacing="xs">
                <Text c="dimmed" size="sm">
                  Species: {plant.species}
                </Text>
                {plant.plantingDate && (
                  <Text c="dimmed" size="sm">
                    Planted: {new Date(plant.plantingDate).toLocaleDateString()}
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
        ))}
      </Grid>

      {plants.length === 0 && !loading && (
        <Paper shadow="md" p="xl" mt="xl">
          <Center>
            <Stack align="center" spacing="md">
              <IconPlant size={60} style={{ color: '#aed581' }} />
              <Text size="lg" fw={600}>
                No plants yet!
              </Text>
              <Text c="dimmed" ta="center">
                Start your garden by adding your first plant.
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
          bottom: 16, 
          right: 16,
          width: 56,
          height: 56
        }}
        onClick={() => setOpen(true)}
      >
        <IconPlus size={24} />
      </ActionIcon>

      <Modal opened={open} onClose={() => setOpen(false)} title="Add New Plant">
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
          <Group position="right" mt="md">
            <Button variant="default" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPlant}>Add Plant</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default PlantList; 