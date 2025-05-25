import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Badge,
  NumberInput,
} from '@mantine/core';
import { IconPlus, IconPlant, IconEye, IconSettings } from '@tabler/icons-react';
import { UserContext } from '../contexts/UserContext';

const GardenManager = () => {
  const navigate = useNavigate();
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCanvas, setNewCanvas] = useState({
    name: '',
    description: '',
    width: 800,
    height: 600
  });
  const { token } = useContext(UserContext);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCanvases();
    }
  }, [token]);

  const handleCreateCanvas = async () => {
    if (!newCanvas.name.trim()) return;
    
    try {
      const response = await fetch('/api/canvases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCanvas),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewCanvas({ name: '', description: '', width: 800, height: 600 });
        fetchCanvases();
      } else {
        setError('Failed to create canvas');
      }
    } catch (err) {
      setError('Error creating canvas');
    }
  };

  const handleOpenCanvas = (canvasId) => {
    navigate(`/canvas/${canvasId}`);
  };

  if (loading) return <Text>Loading canvases...</Text>;

  return (
    <Box>
      <Paper shadow="md" p="xl" mb="xl">
        <Group position="apart" align="center">
          <Box>
            <Text size="xl" fw={700} c="teal" mb="sm">
              🏡 Gardens
            </Text>
            <Text c="dimmed">
              Manage multiple hydroponic setups across different rooms and locations
            </Text>
          </Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
            size="md"
          >
            Create Garden
          </Button>
        </Group>
      </Paper>

      {error && (
        <Alert color="red" mb="lg">
          {error}
        </Alert>
      )}

      {canvases.length === 0 && !loading ? (
        <Paper shadow="md" p="xl" mt="xl">
          <Center>
            <Stack align="center" spacing="md">
              <IconPlant size={60} style={{ color: '#aed581' }} />
              <Text size="lg" fw={600}>
                No gardens yet!
              </Text>
              <Text c="dimmed" ta="center">
                Create your first garden to start organizing your hydroponic setups.
              </Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowCreateModal(true)}
                size="lg"
              >
                Create Your First Garden
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Grid>
          {canvases.map((canvas) => (
                          <Grid.Col span={{ base: 12, sm: 6 }} key={canvas.id}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack spacing="md">
                  <Group position="apart" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Text fw={600} size="lg" c="teal">
                        {canvas.name}
                      </Text>
                      {canvas.description && (
                        <Text size="sm" c="dimmed" mt="xs">
                          {canvas.description}
                        </Text>
                      )}
                    </Box>
                    <ActionIcon
                      variant="light"
                      color="gray"
                      size="sm"
                    >
                      <IconSettings size={16} />
                    </ActionIcon>
                  </Group>

                  <Group spacing="xs">
                    <Badge variant="light" color="green" size="sm">
                      {canvas.width}×{canvas.height}
                    </Badge>
                    <Badge variant="light" color="blue" size="sm">
                      Created {new Date(canvas['created-at']).toLocaleDateString()}
                    </Badge>
                  </Group>

                  <Group position="apart" mt="md">
                    <Button
                      variant="light"
                      leftSection={<IconEye size={16} />}
                      onClick={() => handleOpenCanvas(canvas.id)}
                      fullWidth
                    >
                      Open Garden
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* Create Canvas Modal */}
      <Modal 
        opened={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        title="Create New Garden"
        size="md"
      >
        <Stack spacing="md">
          <TextInput
            label="Garden Name"
            placeholder="e.g., Living Room Hydro, Kitchen Herbs"
            required
            value={newCanvas.name}
            onChange={(e) => setNewCanvas({ ...newCanvas, name: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Describe this growing setup..."
            rows={3}
            value={newCanvas.description}
            onChange={(e) => setNewCanvas({ ...newCanvas, description: e.target.value })}
          />
          <Group grow>
            <NumberInput
              label="Garden Width"
              value={newCanvas.width}
              onChange={(value) => setNewCanvas({ ...newCanvas, width: value || 800 })}
              min={400}
              max={1200}
              step={50}
            />
            <NumberInput
              label="Garden Height"
              value={newCanvas.height}
              onChange={(value) => setNewCanvas({ ...newCanvas, height: value || 600 })}
              min={300}
              max={800}
              step={50}
            />
          </Group>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCanvas} 
              disabled={!newCanvas.name.trim()}
              leftSection={<IconPlus size={16} />}
            >
              Create Garden
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default GardenManager; 