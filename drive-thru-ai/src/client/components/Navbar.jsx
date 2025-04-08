import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FastfoodIcon from '@mui/icons-material/Fastfood';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <FastfoodIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Drive-Thru AI
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" onClick={() => navigate('/')}>
            Order Simulation
          </Button>
          <Button color="inherit" onClick={() => navigate('/orders')}>
            Order Display
          </Button>
          <Button color="inherit" onClick={() => navigate('/menu')}>
            Menu Management
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 