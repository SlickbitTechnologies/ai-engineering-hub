import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import OrderingSimulation from './components/OrderingSimulation';
import OrderDisplay from './components/OrderDisplay';
import MenuManagement from './components/MenuManagement';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    warning: {
      main: '#ff5722'
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              ml: '240px', // Same as sidebar width
              bgcolor: '#FFF',
              minHeight: '100vh',
            }}
          >
            <Routes>
              <Route path="/" element={<OrderingSimulation />} />
              <Route path="/orders" element={<OrderDisplay />} />
              <Route path="/menu" element={<MenuManagement />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
