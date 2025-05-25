import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Text,
  Table,
  TextInput,
  Grid,
  Card,
  Alert,
  Stack,
} from '@mantine/core';
import { UserContext } from '../contexts/UserContext';

const MetricsViewer = ({ plantId, plantName }) => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { token } = useContext(UserContext);

  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    setStartDate(weekAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const fetchMetrics = async () => {
    if (!plantId || !token) return;
    
    try {
      const params = new URLSearchParams();
      if (startDate) {
        // Convert start date to beginning of day in UTC
        const startDateTime = new Date(startDate + 'T00:00:00');
        params.append('startDate', startDateTime.toISOString());
      }
      if (endDate) {
        // Convert end date to end of day in UTC
        const endDateTime = new Date(endDate + 'T23:59:59');
        params.append('endDate', endDateTime.toISOString());
      }
      
      const response = await fetch(`/api/plants/${plantId}/metrics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else {
        setError('Failed to fetch metrics');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (plantId && token) {
      fetchMetrics();
    }
  }, [plantId, token, startDate, endDate]);

  const calculateAverages = () => {
    if (metrics.length === 0) return {};
    
    const validMetrics = metrics.filter(m => m.ec !== null || m.ph !== null);
    
    if (validMetrics.length === 0) return {};
    
    const sums = validMetrics.reduce((acc, metric) => {
      if (metric.ec !== null) acc.ec += metric.ec;
      if (metric.ph !== null) acc.ph += metric.ph;
      acc.count++;
      return acc;
    }, { ec: 0, ph: 0, count: 0 });
    
    return {
      ec: (sums.ec / validMetrics.filter(m => m.ec !== null).length).toFixed(2),
      ph: (sums.ph / validMetrics.filter(m => m.ph !== null).length).toFixed(2),
    };
  };

  const averages = calculateAverages();

  if (loading) return <Text>Loading metrics...</Text>;

  return (
    <Box>
      <Text size="lg" fw={700} mb="lg">
        Metrics for {plantName}
      </Text>
      
      {error && (
        <Alert color="red" mb="lg">
          {error}
        </Alert>
      )}

      <Grid mb="lg">
        <Grid.Col span={6}>
          <TextInput
            label="Start Date"
            type="date"
            size="sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="End Date"
            type="date"
            size="sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Grid.Col>
      </Grid>

      {/* Averages Cards */}
      {Object.keys(averages).length > 0 &&
        <Grid mb="lg">
          <Grid.Col span={6}>
            <Card>
              <Stack align="center" p="xs">
                <Text size="lg" fw={700} c="teal">
                  {averages.ec || 'N/A'}
                </Text>
                <Text size="xs" c="dimmed">Avg EC</Text>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={6}>
            <Card>
              <Stack align="center" p="xs">
                <Text size="lg" fw={700} c="teal">
                  {averages.ph || 'N/A'}
                </Text>
                <Text size="xs" c="dimmed">Avg pH</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      }

      {/* Metrics Table */}
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date & Time</Table.Th>
            <Table.Th align="right">EC</Table.Th>
            <Table.Th align="right">pH</Table.Th>
            <Table.Th>Notes</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {metrics.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4} align="center">
                <Text color="dimmed">
                  No metrics recorded for this period
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            metrics.map((metric) => (
              <Table.Tr key={metric.id}>
                <Table.Td>
                  {new Date(metric.date).toLocaleString()}
                </Table.Td>
                <Table.Td align="right">
                  {metric.ec !== null ? metric.ec : '-'}
                </Table.Td>
                <Table.Td align="right">
                  {metric.ph !== null ? metric.ph : '-'}
                </Table.Td>
                <Table.Td>
                  {metric.notes || '-'}
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Box>
  );
};

export default MetricsViewer; 