import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import {
  Button,
  TextInput,
  Modal,
  Select,
  Alert,
  Card,
  Badge,
  ActionIcon,
  Menu,
  NumberInput,
  Textarea,
  Paper,
  Stack,
  Group,
  Box,
  Text,
  Container,
  Grid,
  Center,
  Divider,
  AppShell
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';

describe('Mantine Components Integration', () => {
  const user = userEvent.setup();

  describe('Core Components', () => {
    it('renders Button component correctly', async () => {
      const handleClick = jest.fn();
      renderWithProviders(
        <Button onClick={handleClick} leftSection={<IconPlus size={16} />}>
          Add Item
        </Button>
      );

      const button = screen.getByRole('button', { name: /Add Item/i });
      expect(button).toBeInTheDocument();
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it('renders TextInput with label and placeholder', async () => {
      const handleChange = jest.fn();
      renderWithProviders(
        <TextInput
          label="Plant Name"
          placeholder="Enter plant name"
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Plant Name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter plant name');

      await user.type(input, 'Tomato');
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders Modal with proper open/close behavior', async () => {
      const { rerender } = renderWithProviders(
        <Modal opened={false} onClose={() => {}} title="Test Modal">
          <Text>Modal Content</Text>
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <Modal opened={true} onClose={() => {}} title="Test Modal">
          <Text>Modal Content</Text>
        </Modal>
      );

      // Wait for modal to fully render
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('renders Select with options', async () => {
      renderWithProviders(
        <Select
          label="Choose Emoji"
          data={[
            { value: '🍅', label: '🍅' },
            { value: '🌿', label: '🌿' },
            { value: '🌶️', label: '🌶️' }
          ]}
          placeholder="Select an emoji"
        />
      );

      // Select might render multiple elements with the label
      const selectInput = screen.getByPlaceholderText('Select an emoji');
      expect(selectInput).toBeInTheDocument();

      await user.click(selectInput);
      
      await waitFor(() => {
        expect(screen.getByText('🍅')).toBeInTheDocument();
        expect(screen.getByText('🌿')).toBeInTheDocument();
        expect(screen.getByText('🌶️')).toBeInTheDocument();
      });
    });

    it('renders Alert with icon and message', () => {
      renderWithProviders(
        <Alert color="red" icon={<IconTrash size={16} />}>
          Error: Failed to delete item
        </Alert>
      );

      expect(screen.getByText('Error: Failed to delete item')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Layout Components', () => {
    it('renders Card with content', () => {
      renderWithProviders(
        <Card shadow="sm" padding="lg">
          <Text>Card Content</Text>
          <Badge color="green">Active</Badge>
        </Card>
      );

      expect(screen.getByText('Card Content')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders Grid with responsive columns', () => {
      renderWithProviders(
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Text>Column 1</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Text>Column 2</Text>
          </Grid.Col>
        </Grid>
      );

      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Column 2')).toBeInTheDocument();
    });

    it('renders Stack with proper spacing', () => {
      renderWithProviders(
        <Stack spacing="md">
          <Text>Item 1</Text>
          <Text>Item 2</Text>
          <Text>Item 3</Text>
        </Stack>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('renders Group with alignment', () => {
      renderWithProviders(
        <Group justify="space-between" align="center">
          <Text>Left</Text>
          <Text>Right</Text>
        </Group>
      );

      expect(screen.getByText('Left')).toBeInTheDocument();
      expect(screen.getByText('Right')).toBeInTheDocument();
    });
  });

  describe('Interactive Components', () => {
    it('renders ActionIcon with click handler', async () => {
      const handleClick = jest.fn();
      renderWithProviders(
        <ActionIcon onClick={handleClick} variant="light" color="blue">
          <IconEdit size={18} />
        </ActionIcon>
      );

      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('renders Menu with dropdown items', async () => {
      const handleEdit = jest.fn();
      const handleDelete = jest.fn();

      renderWithProviders(
        <Menu>
          <Menu.Target>
            <Button>Options</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={handleEdit} leftSection={<IconEdit size={14} />}>
              Edit
            </Menu.Item>
            <Menu.Item onClick={handleDelete} leftSection={<IconTrash size={14} />} color="red">
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      );

      const menuButton = screen.getByRole('button', { name: /Options/i });
      await user.click(menuButton);

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      const editItem = screen.getByText('Edit');
      await user.click(editItem);
      expect(handleEdit).toHaveBeenCalled();
    });

    it('renders NumberInput with constraints', async () => {
      const handleChange = jest.fn();
      renderWithProviders(
        <NumberInput
          label="Garden Width"
          value={800}
          onChange={handleChange}
          min={400}
          max={1200}
          step={50}
        />
      );

      const input = screen.getByLabelText('Garden Width');
      expect(input).toHaveValue('800');

      await user.clear(input);
      await user.type(input, '1000');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders Textarea with rows', () => {
      renderWithProviders(
        <Textarea
          label="Notes"
          placeholder="Add your notes here"
          rows={4}
        />
      );

      const textarea = screen.getByLabelText('Notes');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', 'Add your notes here');
      expect(textarea).toHaveAttribute('rows', '4');
    });
  });

  describe('Styling and Theme', () => {
    it('applies theme colors correctly', () => {
      renderWithProviders(
        <Button color="green">Green Button</Button>
      );

      const button = screen.getByRole('button', { name: /Green Button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('mantine-Button-root');
    });

    it('renders Paper with shadow', () => {
      renderWithProviders(
        <Paper shadow="md" p="xl">
          <Text>Paper Content</Text>
        </Paper>
      );

      expect(screen.getByText('Paper Content')).toBeInTheDocument();
      const paper = screen.getByText('Paper Content').parentElement;
      expect(paper).toHaveClass('mantine-Paper-root');
    });

    it('renders Badge with variants', () => {
      renderWithProviders(
        <>
          <Badge variant="filled" color="green">Filled</Badge>
          <Badge variant="light" color="blue">Light</Badge>
          <Badge variant="outline" color="red">Outline</Badge>
        </>
      );

      expect(screen.getByText('Filled')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Outline')).toBeInTheDocument();
    });
  });

  describe('Responsive Components', () => {
    it('renders Container with size constraints', () => {
      renderWithProviders(
        <Container size="lg">
          <Text>Container Content</Text>
        </Container>
      );

      expect(screen.getByText('Container Content')).toBeInTheDocument();
      const container = screen.getByText('Container Content').parentElement;
      expect(container).toHaveClass('mantine-Container-root');
    });

    it('renders AppShell structure', () => {
      renderWithProviders(
        <AppShell header={{ height: 60 }} padding="md">
          <AppShell.Header>
            <Text>Header</Text>
          </AppShell.Header>
          <AppShell.Main>
            <Text>Main Content</Text>
          </AppShell.Main>
        </AppShell>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('renders Center component', () => {
      renderWithProviders(
        <Center h={200}>
          <Text>Centered Content</Text>
        </Center>
      );

      expect(screen.getByText('Centered Content')).toBeInTheDocument();
      const center = screen.getByText('Centered Content').parentElement;
      expect(center).toHaveClass('mantine-Center-root');
    });

    it('renders Divider', () => {
      renderWithProviders(
        <Box>
          <Text>Above</Text>
          <Divider my="md" />
          <Text>Below</Text>
        </Box>
      );

      expect(screen.getByText('Above')).toBeInTheDocument();
      expect(screen.getByText('Below')).toBeInTheDocument();
      // Divider might be rendered differently in Mantine
      const divider = screen.getByText('Above').parentElement?.querySelector('.mantine-Divider-root');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('Form Components Integration', () => {
    it('handles form submission with Mantine inputs', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      
      renderWithProviders(
        <form onSubmit={handleSubmit}>
          <Stack spacing="md">
            <TextInput label="Name" name="name" required />
            <Select
              label="Type"
              name="type"
              data={['Plant', 'Flower', 'Herb']}
              required
            />
            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      );

      // Use more specific queries for form fields
      const nameInput = screen.getByRole('textbox', { name: /Name/i });
      // Select components in Mantine might not have combobox role, use the input directly
      const typeSelect = screen.getByRole('textbox', { name: /Type/i });
      const submitButton = screen.getByRole('button', { name: /Submit/i });

      await user.type(nameInput, 'Test Plant');
      await user.click(typeSelect);
      
      await waitFor(() => {
        expect(screen.getByText('Plant')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Plant'));
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
}); 