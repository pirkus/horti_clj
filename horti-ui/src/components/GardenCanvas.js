import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Text,
  Button,
  Modal,
  TextInput,
  Grid,
  Select,
  Badge,
  Alert,
  Group,
  Stack,
  Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconChartLine, IconTimeline, IconArrowLeft } from '@tabler/icons-react';
import { UserContext } from '../contexts/UserContext';
import MetricsViewer from './MetricsViewer';

const Garden = () => {
  const { canvasId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showMetricsViewer, setShowMetricsViewer] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [canvasInfo, setCanvasInfo] = useState(null);
  
  // Enhanced drag state with threshold detection
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPlant, setDraggedPlant] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [mouseDownPlant, setMouseDownPlant] = useState(null);
  const [hasDraggedBeyondThreshold, setHasDraggedBeyondThreshold] = useState(false);
  
  const DRAG_THRESHOLD = 5; // pixels

  const [newPlant, setNewPlant] = useState({
    type: '',
    name: '',
    x: 0,
    y: 0
  });

  const [newMetrics, setNewMetrics] = useState({
    date: new Date(),
    time: new Date().toTimeString().slice(0, 5), // HH:MM format
    ec: '',
    ph: '',
    notes: ''
  });

  const { token } = useContext(UserContext);

  const defaultPlantImages = [
    { name: 'Tomato', url: 'https://via.placeholder.com/50x50/4caf50/ffffff?text=🍅' },
    { name: 'Lettuce', url: 'https://via.placeholder.com/50x50/66bb6a/ffffff?text=🥬' },
    { name: 'Basil', url: 'https://via.placeholder.com/50x50/8bc34a/ffffff?text=🌿' },
    { name: 'Pepper', url: 'https://via.placeholder.com/50x50/ff7043/ffffff?text=🌶️' },
    { name: 'Spinach', url: 'https://via.placeholder.com/50x50/4caf50/ffffff?text=🥬' },
  ];

  const fetchCanvasInfo = useCallback(async () => {
    if (!canvasId) {
      setError('No canvas ID provided');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/canvases/${canvasId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const canvas = await response.json();
        setCanvasInfo(canvas);
        setCanvasSize({ width: canvas.width || 800, height: canvas.height || 600 });
      } else {
        setError('Failed to fetch canvas info');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  }, [token, canvasId]);

  const fetchPlants = useCallback(async () => {
    if (!canvasId) {
      setError('No canvas ID provided');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/canvases/${canvasId}/plants`, {
        headers: { 'Authorization': `Bearer ${token}` },
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
  }, [token, canvasId]);

  useEffect(() => {
    if (token && canvasId) {
      fetchCanvasInfo();
      fetchPlants();
    }
  }, [token, canvasId, fetchCanvasInfo, fetchPlants]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#f1f8e9';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvasSize.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasSize.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    // Draw plants
    plants.forEach(plant => {
      if (plant.x !== undefined && plant.y !== undefined) {
        // Highlight dragged plant
        const isBeingDragged = draggedPlant?.id === plant.id;
        const isSelected = selectedPlant?.id === plant.id;
        
        // Draw plant circle with different colors for different states
        if (isBeingDragged) {
          ctx.fillStyle = '#2196f3'; // Blue when dragging
        } else if (isSelected) {
          ctx.fillStyle = '#ff9800'; // Orange when selected
        } else {
          ctx.fillStyle = '#4caf50'; // Green normally
        }
        
        ctx.beginPath();
        ctx.arc(plant.x, plant.y, 25, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw plant name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(plant.name, plant.x, plant.y + 4);
        
        // Draw drag indicator for dragged plant
        if (isBeingDragged) {
          ctx.strokeStyle = '#1976d2';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(plant.x, plant.y, 30, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });
  }, [plants, selectedPlant, draggedPlant, canvasSize.width, canvasSize.height]);

  useEffect(() => {
    if (!loading) {
      drawCanvas();
    }
  }, [loading, drawCanvas]);

  const getMousePos = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const findPlantAtPosition = (x, y) => {
    return plants.find(plant => {
      const distance = Math.sqrt((x - plant.x) ** 2 + (y - plant.y) ** 2);
      return distance <= 25;
    });
  };

  const updatePlantPosition = async (plantId, newX, newY) => {
    try {
      const response = await fetch(`/api/plants/${plantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ x: newX, y: newY }),
      });

      if (response.ok) {
        // Update local state
        setPlants(prev => prev.map(plant => 
          plant.id === plantId 
            ? { ...plant, x: newX, y: newY }
            : plant
        ));
      } else {
        setError('Failed to update plant position');
        // Revert to original position by refetching
        fetchPlants();
      }
    } catch (err) {
      setError('Error updating plant position');
      fetchPlants();
    }
  };

  const handleMouseDown = (event) => {
    const mousePos = getMousePos(event);
    const clickedPlant = findPlantAtPosition(mousePos.x, mousePos.y);

    if (clickedPlant) {
      // Track initial mouse position and clicked plant for potential drag
      setMouseDownPos(mousePos);
      setMouseDownPlant(clickedPlant);
      setDragOffset({
        x: mousePos.x - clickedPlant.x,
        y: mousePos.y - clickedPlant.y
      });
      
      // Change cursor to indicate potential drag
      const canvas = canvasRef.current;
      canvas.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (event) => {
    const mousePos = getMousePos(event);
    const canvas = canvasRef.current;

    if (mouseDownPlant && !isDragging) {
      // Check if we've moved beyond the drag threshold
      const distance = Math.sqrt(
        Math.pow(mousePos.x - mouseDownPos.x, 2) + 
        Math.pow(mousePos.y - mouseDownPos.y, 2)
      );
      
      if (distance > DRAG_THRESHOLD) {
        // Start actual dragging
        setIsDragging(true);
        setDraggedPlant(mouseDownPlant);
        setHasDraggedBeyondThreshold(true);
      }
    }

    if (isDragging && draggedPlant) {
      // Update plant position in real-time during drag
      const newX = Math.max(25, Math.min(canvasSize.width - 25, mousePos.x - dragOffset.x));
      const newY = Math.max(25, Math.min(canvasSize.height - 25, mousePos.y - dragOffset.y));
      
      // Update local state for immediate visual feedback
      setPlants(prev => prev.map(plant => 
        plant.id === draggedPlant.id 
          ? { ...plant, x: newX, y: newY }
          : plant
      ));
    } else if (!mouseDownPlant) {
      // Update cursor based on what's under the mouse
      const plantUnderMouse = findPlantAtPosition(mousePos.x, mousePos.y);
      canvas.style.cursor = plantUnderMouse ? 'grab' : 'crosshair';
    }
  };

  const handleMouseUp = async (event) => {
    const mousePos = getMousePos(event);
    const canvas = canvasRef.current;
    
    if (isDragging && draggedPlant) {
      // Handle end of drag - save position to backend
      const newX = Math.max(25, Math.min(canvasSize.width - 25, mousePos.x - dragOffset.x));
      const newY = Math.max(25, Math.min(canvasSize.height - 25, mousePos.y - dragOffset.y));
      
      await updatePlantPosition(draggedPlant.id, newX, newY);
    } else if (mouseDownPlant && !hasDraggedBeyondThreshold) {
      // This was a click, not a drag - open metrics dialog
      setSelectedPlant(mouseDownPlant);
      setShowMetrics(true);
    }
    
    // Reset all drag-related state
    setIsDragging(false);
    setDraggedPlant(null);
    setMouseDownPlant(null);
    setHasDraggedBeyondThreshold(false);
    setDragOffset({ x: 0, y: 0 });
    setMouseDownPos({ x: 0, y: 0 });
    
    canvas.style.cursor = 'crosshair';
  };

  const handleCanvasClick = (event) => {
    // Only handle clicks for adding new plants in empty space
    // Plant clicks are now handled in handleMouseUp
    if (isDragging || mouseDownPlant) return;
    
    const mousePos = getMousePos(event);
    const clickedPlant = findPlantAtPosition(mousePos.x, mousePos.y);

    if (!clickedPlant) {
      // Add new plant at clicked position (empty space)
      setNewPlant(prev => ({ ...prev, x: mousePos.x, y: mousePos.y }));
      setShowAddPlant(true);
    }
  };

  const handleAddPlant = async () => {
    if (!newPlant.type || !newPlant.name || !canvasId) return; // Require both type and name and canvas
    
    try {
      const response = await fetch(`/api/canvases/${canvasId}/plants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPlant.name,
          type: newPlant.type,
          x: newPlant.x,
          y: newPlant.y,
          'planting-date': new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        setShowAddPlant(false);
        setNewPlant({ type: '', name: '', x: 0, y: 0 });
        fetchPlants();
      } else {
        setError('Failed to add plant');
      }
    } catch (err) {
      setError('Error adding plant');
    }
  };

  const handleAddMetrics = async () => {
    if (!selectedPlant) return;

    try {
      // Combine date and time into a single timestamp
      const dateStr = newMetrics.date.toISOString().split('T')[0];
      const timestamp = new Date(`${dateStr}T${newMetrics.time}:00`).toISOString();
      
      const response = await fetch(`/api/plants/${selectedPlant.id}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          'plant-id': selectedPlant.id,
          date: timestamp,
          ec: parseFloat(newMetrics.ec) || null,
          ph: parseFloat(newMetrics.ph) || null,
          notes: newMetrics.notes
        }),
      });

      if (response.ok) {
        setShowMetrics(false);
        setNewMetrics({
          date: new Date(),
          time: new Date().toTimeString().slice(0, 5),
          ec: '', ph: '', notes: ''
        });
        setSelectedPlant(null);
      } else {
        setError('Failed to add metrics');
      }
    } catch (err) {
      setError('Error adding metrics');
    }
  };

  const handleViewMetrics = () => {
    setShowMetrics(false);
    setShowMetricsViewer(true);
  };

  if (loading) return <Text>Loading garden...</Text>;

  return (
    <Box>
      <Paper shadow="md" p="md" mb="xl">
        <Group position="apart" align="center" mb="md">
          <Group align="center">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/')}
              size="sm"
            >
              Back to Dashboard
            </Button>
            <Box>
                          <Text size="xl" fw={700} c="teal">
              🌱 {canvasInfo?.name || 'Garden'}
            </Text>
              {canvasInfo?.description && (
                <Text size="sm" c="dimmed">
                  {canvasInfo.description}
                </Text>
              )}
            </Box>
          </Group>
        </Group>
        <Text c="dimmed" mb="md">
          Click anywhere to add a plant, drag plants to move them, or click on existing plants to log daily metrics
        </Text>
        <Group spacing="xs">
          <Badge variant="outline" color="green" size="sm">
            📐 {canvasSize.width}×{canvasSize.height}
          </Badge>
          <Badge variant="outline" color="teal" size="sm">💡 Click empty space to add plants</Badge>
          <Badge variant="outline" color="teal" size="sm">🖱️ Drag plants to move them around</Badge>
          <Badge variant="outline" color="teal" size="sm">📊 Click plants to log EC & pH</Badge>
        </Group>
      </Paper>

      {error && (
        <Alert color="red" mb="xl">
          {error}
        </Alert>
      )}

      <Paper shadow="md" p="md" style={{ display: 'inline-block', maxWidth: '100%', overflow: 'auto' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{
            border: '2px solid #20c997',
            borderRadius: '8px',
            cursor: 'crosshair',
            backgroundColor: '#f1f8e9',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </Paper>

      {/* Add Plant Dialog */}
      <Modal opened={showAddPlant} onClose={() => setShowAddPlant(false)} title={`Add Plant at (${Math.round(newPlant.x)}, ${Math.round(newPlant.y)})`}>
        <Stack spacing="md">
          <Select
            label="Plant Type"
            placeholder="Select plant type"
            required
            value={newPlant.type}
            onChange={(value) => {
              if (value) {
                // Auto-set name to match type when type is selected
                setNewPlant({ 
                  ...newPlant, 
                  type: value, 
                  name: newPlant.name || value // Only update name if it's empty
                });
              } else {
                setNewPlant({ ...newPlant, type: '' });
              }
            }}
            data={defaultPlantImages.map((img) => ({
              value: img.name,
              label: img.name
            }))}
            size="md"
          />
          <TextInput
            label="Plant Name"
            placeholder="Name for this plant"
            required
            value={newPlant.name}
            onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setShowAddPlant(false)}>Cancel</Button>
            <Button onClick={handleAddPlant} disabled={!newPlant.type || !newPlant.name}>Add Plant</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Daily Metrics Dialog */}
      <Modal opened={showMetrics} onClose={() => setShowMetrics(false)} size="lg" title={`Log Daily Metrics - ${selectedPlant?.name}`}>
        <Text size="sm" c="dimmed" mb="md">
          Position: ({selectedPlant?.x}, {selectedPlant?.y})
        </Text>
        <Stack spacing="md">
          <Grid>
            <Grid.Col span={8}>
              <DateInput
                label="Date"
                value={newMetrics.date}
                onChange={(value) => setNewMetrics({ ...newMetrics, date: value || new Date() })}
                valueFormat="DD MMM YYYY"
                styles={{
                  input: {
                    height: '36px',
                    border: '1px solid #E9ECEF',
                    '&:focus': {
                      borderColor: 'var(--mantine-color-green-6)',
                    }
                  },
                  calendarHeaderControl: { 
                    width: '24px',
                    height: '24px',
                    minWidth: '24px',
                    fontSize: '14px',
                    color: 'var(--mantine-color-green-6)',
                  },
                  day: { 
                    borderRadius: '4px',
                    height: '34px',
                    width: '34px',
                    fontSize: '14px',
                    '&[data-selected]': {
                      backgroundColor: 'var(--mantine-color-green-6)',
                    }
                  }
                }}
                placeholder="Select date"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                type="time"
                label="Time"
                value={newMetrics.time}
                onChange={(e) => setNewMetrics({ ...newMetrics, time: e.target.value })}
                styles={{
                  input: {
                    height: '36px',
                    border: '1px solid #E9ECEF',
                    '&:focus': {
                      borderColor: '#4CAF50',
                    }
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="EC (Electrical Conductivity)"
                placeholder="e.g., 1.2"
                value={newMetrics.ec}
                onChange={(e) => setNewMetrics({ ...newMetrics, ec: e.target.value })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="pH Level"
                placeholder="e.g., 6.5"
                value={newMetrics.ph}
                onChange={(e) => setNewMetrics({ ...newMetrics, ph: e.target.value })}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Notes"
                placeholder="Any observations about the plant today..."
                value={newMetrics.notes}
                onChange={(e) => setNewMetrics({ ...newMetrics, notes: e.target.value })}
              />
            </Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setShowMetrics(false)}>Cancel</Button>
            <Button variant="outline" leftSection={<IconTimeline />} onClick={handleViewMetrics}>
              View Metrics History
            </Button>
            <Button leftSection={<IconChartLine />} onClick={handleAddMetrics}>
              Log Metrics
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Metrics Viewer Dialog */}
      <Modal opened={showMetricsViewer} onClose={() => setShowMetricsViewer(false)} size="xl" title={`Metrics History - ${selectedPlant?.name}`}>
        <MetricsViewer 
          plantId={selectedPlant?.id} 
          plantName={selectedPlant?.name} 
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setShowMetricsViewer(false)}>Close</Button>
          <Button 
            onClick={() => {
              setShowMetricsViewer(false);
              setShowMetrics(true);
            }} 
            leftSection={<IconChartLine />}
          >
            Log New Metrics
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default Garden; 