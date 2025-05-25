import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Paper, Text, Box, Container, Stack, Center } from '@mantine/core';

const Login = ({ onLogin }) => {
  const handleSuccess = (credentialResponse) => {
    console.log('Login successful:', credentialResponse);
    onLogin(credentialResponse.credential);
  };

  const handleError = () => {
    console.log('Login failed');
  };

  return (
    <Container size="sm">
      <Box mt="xl">
        <Center>
          <Paper shadow="lg" p="xl" w="100%" maw={400}>
            <Stack align="center" spacing="lg">
              <Box ta="center">
                <Text size="xl" fw={700} c="teal" mb="sm">
                  🌱 Welcome to Horti
                </Text>
                <Text size="lg" c="dimmed" mb="sm">
                  Your personal garden companion
                </Text>
                <Text mb="xl">
                  Track your plants, log garden activities, and grow your green thumb!
                </Text>
              </Box>
              
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                size="large"
                theme="outline"
                shape="rectangular"
              />
            </Stack>
          </Paper>
        </Center>
      </Box>
    </Container>
  );
};

export default Login; 