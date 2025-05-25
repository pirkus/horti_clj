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
  Badge,
} from '@mantine/core';
import { IconPlus, IconNotebook } from '@tabler/icons-react';
import { UserContext } from '../contexts/UserContext';

const GardenLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    plants: '',
    weather: '',
    notes: ''
  });
  const { token } = useContext(UserContext);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/garden-logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else {
        setError('Failed to fetch garden logs');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token]);

  const handleAddLog = async () => {
    try {
      const response = await fetch('/api/garden-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newLog),
      });

      if (response.ok) {
        setOpen(false);
        setNewLog({
          date: new Date().toISOString().split('T')[0],
          activity: '',
          plants: '',
          weather: '',
          notes: ''
        });
        fetchLogs(); // Refresh the list
      } else {
        setError('Failed to add garden log');
      }
    } catch (err) {
      setError('Error adding garden log');
    }
  };

  if (loading) return <Text>Loading garden logs...</Text>;

  return (
    <Box>
      <Paper shadow="md" p="xl" mb="xl">
        <Text size="xl" fw={700} c="teal" mb="sm">
          📝 Garden Logs
        </Text>
        <Text c="dimmed">
          Track your gardening activities and observations
        </Text>
      </Paper>

      {error && (
        <Alert color="red" mb="lg">
          {error}
        </Alert>
      )}

      <Grid>
        {logs.map((log) => (
          <Grid.Col span={12} key={log.id}>
            <Card shadow="md" padding="lg">
              <Group position="apart" mb="md">
                <Group>
                  <IconNotebook size={24} style={{ color: '#8bc34a' }} />
                  <Text size="lg" fw={600}>
                    {log.activity}
                  </Text>
                </Group>
                <Text size="sm" c="dimmed">
                  {new Date(log.date).toLocaleDateString()}
                </Text>
              </Group>
              
              <Stack spacing="xs">
                {log.plants && (
                  <Group spacing="xs">
                    <Text size="sm" fw={600}>Plants:</Text>
                    <Badge variant="light" color="green" size="sm">
                      {log.plants}
                    </Badge>
                  </Group>
                )}
                
                {log.weather && (
                  <Group spacing="xs">
                    <Text size="sm" fw={600}>Weather:</Text>
                    <Badge variant="light" color="blue" size="sm">
                      {log.weather}
                    </Badge>
                  </Group>
                )}
                
                {log.notes && (
                  <Text size="sm" mt="sm">
                    {log.notes}
                  </Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {logs.length === 0 && !loading && (
        <Paper shadow="md" p="xl" mt="xl">
          <Center>
            <Stack align="center" spacing="md">
              <IconNotebook size={60} style={{ color: '#aed581' }} />
              <Text size="lg" fw={600}>
                No garden logs yet!
              </Text>
              <Text c="dimmed" ta="center">
                Start tracking your gardening activities.
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

      <Modal opened={open} onClose={() => setOpen(false)} title="Add Garden Log">
        <Stack spacing="md">
          <TextInput
            label="Date"
            type="date"
            value={newLog.date}
            onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
          />
          <TextInput
            label="Activity"
            placeholder="What did you do in your garden?"
            value={newLog.activity}
            onChange={(e) => setNewLog({ ...newLog, activity: e.target.value })}
          />
          <TextInput
            label="Plants Involved"
            placeholder="Which plants were involved?"
            value={newLog.plants}
            onChange={(e) => setNewLog({ ...newLog, plants: e.target.value })}
          />
          <TextInput
            label="Weather"
            placeholder="Weather conditions"
            value={newLog.weather}
            onChange={(e) => setNewLog({ ...newLog, weather: e.target.value })}
          />
          <Textarea
            label="Notes"
            placeholder="Additional observations or notes"
            rows={3}
            value={newLog.notes}
            onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
          />
          <Group position="right" mt="md">
            <Button variant="default" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLog}>Add Log</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default GardenLogs; 