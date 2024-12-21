import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { Hand } from 'lucide-react';

const Hello = () => {
  const { user } = useAuth0();

  return (
    <Container maxWidth="md" sx={{ mt: 12 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Hand size={32} />
            <Typography variant="h4" sx={{ ml: 2 }}>
              Hello {user?.name}!
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            Welcome to your personalized dashboard. This is a protected page that only authenticated users can see.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You're logged in with: {user?.email}
          </Typography>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Hello;

