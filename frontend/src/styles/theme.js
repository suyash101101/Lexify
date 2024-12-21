import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#38bdf8', // sky-400
      light: '#7dd3fc', // sky-300
      dark: '#0ea5e9', // sky-500
    },
    secondary: {
      main: '#60a5fa', // blue-400
      light: '#93c5fd', // blue-300
      dark: '#3b82f6', // blue-500
    },
    background: {
      default: '#f0f9ff', // sky-50
      paper: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      primary: '#0369a1', // sky-700
      secondary: '#38bdf8', // sky-400
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '12px',
          background: 'rgba(56, 189, 248, 0.1)',
          color: '#38bdf8',
          '&:hover': {
            background: 'rgba(56, 189, 248, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
        },
      },
    },
  },
});
