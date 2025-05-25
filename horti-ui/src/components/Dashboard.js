import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  Text,
  Button,
  Box,
  Paper,
  Stack,
  Group,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Badge,
  ActionIcon,
  Alert,
  Menu,
} from '@mantine/core';
import {
  IconPlant,
  IconNotebook,
  IconPlus,
  IconEye,
  IconSettings,
  IconEdit,
  IconArchive,
  IconDots,
} from '@tabler/icons-react';
import { UserContext } from '../contexts/UserContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(UserContext);
  const [canvases, setCanvases] = useState([]);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedCanvas, setSelectedCanvas] = useState(null);
  const [newCanvas, setNewCanvas] = useState({
    name: '',
    description: '',
    width: 800,
    height: 600
  });
  const [editCanvas, setEditCanvas] = useState({
    name: '',
    description: '',
    width: 800,
    height: 600
  });

  const fetchCanvases = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCanvases();
    }
  }, [token, fetchCanvases]);

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

  const handleEditCanvas = async () => {
    if (!editCanvas.name.trim() || !selectedCanvas) return;
    
    try {
      const response = await fetch(`/api/canvases/${selectedCanvas.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editCanvas),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedCanvas(null);
        setEditCanvas({ name: '', description: '', width: 800, height: 600 });
        fetchCanvases();
      } else {
        setError('Failed to update canvas');
      }
    } catch (err) {
      setError('Error updating canvas');
    }
  };

  const handleArchiveCanvas = async () => {
    if (!selectedCanvas) return;
    
    try {
      const response = await fetch(`/api/canvases/${selectedCanvas.id}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ archived: true }),
      });

      if (response.ok) {
        setShowArchiveModal(false);
        setSelectedCanvas(null);
        fetchCanvases();
      } else {
        setError('Failed to archive canvas');
      }
    } catch (err) {
      setError('Error archiving canvas');
    }
  };

  const handleOpenEditModal = (canvas) => {
    setSelectedCanvas(canvas);
    setEditCanvas({
      name: canvas.name,
      description: canvas.description || '',
      width: canvas.width || 800,
      height: canvas.height || 600
    });
    setShowEditModal(true);
  };

  const handleOpenArchiveModal = (canvas) => {
    setSelectedCanvas(canvas);
    setShowArchiveModal(true);
  };

  const handleOpenCanvas = (canvasId) => {
    navigate(`/canvas/${canvasId}`);
  };

  const dashboardCards = [
    {
      title: 'Create New Garden',
      description: 'Set up a new hydroponic growing area',
      icon: <IconPlus size={40} style={{ color: '#20c997' }} />,
      actions: [
        { label: 'Create Garden', onClick: () => setShowCreateModal(true), icon: <IconPlus size={16} /> },
      ],
      featured: true,
    },
    {
      title: 'My Plants',
      description: 'View and manage your plant collection',
      icon: <IconPlant size={40} style={{ color: '#20c997' }} />,
      actions: [
        { label: 'View Plants', onClick: () => navigate('/plants'), icon: <IconEye size={16} /> },
      ],
    },
    {
      title: 'Garden Logs',
      description: 'Track your gardening activities and progress',
      icon: <IconNotebook size={40} style={{ color: '#8bc34a' }} />,
      actions: [
        { label: 'View Logs', onClick: () => navigate('/logs'), icon: <IconEye size={16} /> },
      ],
    },
  ];

  return (
    <Box>
      <Paper 
        shadow="md" 
        p="xl" 
        mb="xl" 
        style={{ 
          background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)' 
        }}
      >
        <Text size="xl" fw={700} c="teal" mb="sm">
          Welcome to Your Garden Dashboard
        </Text>
        <Text c="dimmed">
          Hello {user?.name || user?.email}! Manage your plants and track your gardening journey.
        </Text>
      </Paper>

      {error && (
        <Alert color="red" mb="lg">
          {error}
        </Alert>
      )}

      {/* Canvas Tiles Section */}
      {canvases.length > 0 && (
        <Box mb="xl">
          <Text size="lg" fw={600} c="teal" mb="md">
            🏡 Your Gardens
          </Text>
          <Grid>
            {canvases.map((canvas) => (
              <Grid.Col span={{ base: 12, sm: 6 }} key={canvas.id}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack spacing="md">
                    <Group justify="space-between" align="flex-start">
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
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon
                            variant="light"
                            color="gray"
                            size="sm"
                          >
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => handleOpenEditModal(canvas)}
                          >
                            Edit Garden
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconArchive size={14} />}
                            color="orange"
                            onClick={() => handleOpenArchiveModal(canvas)}
                          >
                            Archive Garden
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <Group spacing="xs">
                      <Badge variant="light" color="green" size="sm">
                        {canvas.width}×{canvas.height}
                      </Badge>
                      <Badge variant="light" color="blue" size="sm">
                        Created {new Date(canvas['created-at']).toLocaleDateString()}
                      </Badge>
                    </Group>

                    <Group justify="space-between" mt="md">
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
        </Box>
      )}

      <Grid>
        {dashboardCards.map((card, index) => (
          <Grid.Col span={card.featured ? 12 : { base: 12, sm: 6 }} key={index}>
            <Card 
              shadow={card.featured ? "lg" : "md"} 
              padding="lg" 
              h="100%"
              style={{
                transition: 'transform 0.2s',
                cursor: 'pointer',
                ...(card.featured && {
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                  border: '2px solid #20c997'
                })
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
            >
              <Stack align="center" spacing="md" h="100%">
                <Box pt="md">
                  {card.icon}
                </Box>
                <Text size="lg" fw={600} ta="center">
                  {card.title}
                </Text>
                <Text size="sm" c="dimmed" ta="center" style={{ flexGrow: 1 }}>
                  {card.description}
                </Text>
                <Group>
                  {card.actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      variant="filled"
                      leftSection={action.icon}
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Box mt="xl">
        <Paper shadow="md" p="xl">
          <Text size="lg" fw={600} c="teal" mb="md">
            Garden Usage Tips 🎯
          </Text>
          <Stack spacing="xs">
            <Text size="sm">
              • <strong>Add Plants:</strong> Click anywhere in your garden to place a new plant at that location
            </Text>
            <Text size="sm">
              • <strong>Log Metrics:</strong> Click on any existing plant to record daily EC & pH values
            </Text>
            <Text size="sm">
              • <strong>Track Growth:</strong> Use the visual layout to understand plant spacing and monitor your garden's development
            </Text>
            <Text size="sm">
              • <strong>Daily Routine:</strong> Make it a habit to log at least pH and EC daily for optimal plant health monitoring
            </Text>
          </Stack>
        </Paper>
      </Box>

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

      {/* Edit Canvas Modal */}
      <Modal 
        opened={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title={`Edit Garden: ${selectedCanvas?.name}`}
        size="md"
      >
        <Stack spacing="md">
          <TextInput
            label="Garden Name"
            placeholder="e.g., Living Room Hydro, Kitchen Herbs"
            required
            value={editCanvas.name}
            onChange={(e) => setEditCanvas({ ...editCanvas, name: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Describe this growing setup..."
            rows={3}
            value={editCanvas.description}
            onChange={(e) => setEditCanvas({ ...editCanvas, description: e.target.value })}
          />
          <Group grow>
            <NumberInput
              label="Garden Width"
              value={editCanvas.width}
              onChange={(value) => setEditCanvas({ ...editCanvas, width: value || 800 })}
              min={400}
              max={1200}
              step={50}
            />
            <NumberInput
              label="Garden Height"
              value={editCanvas.height}
              onChange={(value) => setEditCanvas({ ...editCanvas, height: value || 600 })}
              min={300}
              max={800}
              step={50}
            />
          </Group>
          <Alert color="blue" variant="light">
            <Text size="sm">
              📏 <strong>Note:</strong> If you change the garden size, any plants outside the new boundaries will be automatically moved inside.
            </Text>
          </Alert>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditCanvas} 
              disabled={!editCanvas.name.trim()}
              leftSection={<IconEdit size={16} />}
            >
              Update Garden
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Archive Canvas Modal */}
      <Modal 
        opened={showArchiveModal} 
        onClose={() => setShowArchiveModal(false)} 
        title="Archive Garden"
        size="sm"
      >
        <Stack spacing="md">
          <Text>
            Are you sure you want to archive <strong>{selectedCanvas?.name}</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            Archived gardens won't appear in your main dashboard but can be restored later from the archived section.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setShowArchiveModal(false)}>
              Cancel
            </Button>
            <Button 
              color="orange"
              onClick={handleArchiveCanvas}
              leftSection={<IconArchive size={16} />}
            >
              Archive Garden
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Dashboard; 