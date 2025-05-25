import React, { useContext } from 'react';
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
} from '@mantine/core';
import {
  IconPlant,
  IconNotebook,
  IconPlus,
  IconEye,
} from '@tabler/icons-react';
import { UserContext } from '../contexts/UserContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const dashboardCards = [
    {
      title: 'Interactive Garden Canvas',
      description: 'Place plants visually and log daily metrics (EC & pH)',
      icon: <IconPlus size={40} style={{ color: '#20c997' }} />,
      actions: [
        { label: 'Open Canvas', onClick: () => navigate('/canvas'), icon: <IconEye size={16} /> },
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

      <Grid>
        {dashboardCards.map((card, index) => (
          <Grid.Col span={card.featured ? 12 : 6} key={index}>
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
                      leftIcon={action.icon}
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
            Canvas Usage Tips 🎯
          </Text>
          <Stack spacing="xs">
            <Text size="sm">
              • <strong>Add Plants:</strong> Click anywhere on the canvas to place a new plant at that location
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
    </Box>
  );
};

export default Dashboard; 