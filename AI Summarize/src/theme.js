import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    secondary: {
      main: '#FF4081',
      light: '#FF80AB',
      dark: '#F50057',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      '@media (min-width:600px)': {
        fontSize: '3.5rem',
      },
    },
    h3: {
      fontSize: '2rem',
      '@media (min-width:600px)': {
        fontSize: '3rem',
      },
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '16px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
  },
});

export default theme; 