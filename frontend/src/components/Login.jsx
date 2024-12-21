import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Button, 
  Container, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress 
} from '@mui/material';
import { motion } from 'framer-motion';
import { LockIcon, AlertCircle } from 'lucide-react';

const Login = () => {
  const { loginWithRedirect, isAuthenticated, isLoading, user, error } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      sessionStorage.setItem('userAddress', user.sub);
      const destination = location.state?.returnTo || '/profile';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleLogin = async () => {
    try {
      await loginWithRedirect({
        appState: { 
          returnTo: '/profile'
        },
        authorizationParams: {
          prompt: 'login',
          redirect_uri: window.location.origin
        }
      });
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <AlertCircle color="error" />
            <Typography variant="h6" color="error">Authentication Error</Typography>
          </Box>
          <Typography color="error" gutterBottom>
            {error.message}
          </Typography>
          <Button 
            fullWidth
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  if (isAuthenticated) {
    navigate('/profile', { replace: true });
    return null;
  }

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <LockIcon size={48} color="primary" />
            <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
              Welcome
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center">
              Sign in to JusticeChain to access your cases and more
            </Typography>
          </Box>
          
          <Button 
            fullWidth
            variant="contained" 
            onClick={handleLogin}
            size="large"
            startIcon={<LockIcon size={18} />}
          >
            Sign In with Google
          </Button>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Login;

