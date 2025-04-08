import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Ordering Simulation',
      icon: <ChatIcon />,
      path: '/'
    },
    {
      text: 'Order Display',
      icon: <RestaurantIcon />,
      path: '/orders'
    },
    {
      text: 'Menu Management',
      icon: <MenuBookIcon />,
      path: '/menu'
    }
  ];

  return (
    <Box
      sx={{
        width: 240,
        backgroundColor: '#FFF',
        color: 'white',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRight: '1px solid #EEE'
      }}
    >
      <Box sx={{ p: 0 }}>
        <Typography variant="h6" sx={{ color: '#ff5722', fontWeight: 'bold' }}>
          Drive
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              backgroundColor: location.pathname === item.path ? '#2a3447' : '#FFF',
              color: location.pathname === item.path ? '#FFF' : '#2a3447',
              '&:hover': {
                backgroundColor: '#2a3447',
                color: '#FFF',
              },
              // mb: 1,
              // mx: 1,
              // borderRadius: 1,
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? '#FFF' : '#2a3447', 
                minWidth: 40,
                '&:hover': {
                color: '#FFF',
              },
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar; 