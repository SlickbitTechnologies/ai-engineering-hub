import React from 'react';
import {
  AppBar as MuiAppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { label: 'Chat', icon: <ChatIcon />, path: '/chat' },
  { label: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const AppBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  return (
    <MuiAppBar 
      position="sticky" 
      elevation={0}
      sx={{
        bgcolor: 'rgba(26, 27, 46, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              color: '#FFFFFF',
              fontWeight: 600,
              mr: 4,
            }}
          >
            Transliteration Chat
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: location.pathname === item.path ? '#7B61FF' : 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'none',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: '#2D2F52',
                    },
                    ...(location.pathname === item.path && {
                      bgcolor: 'rgba(123, 97, 255, 0.1)',
                    }),
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
            <>
              {!isMobile && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    mr: 2,
                  }}
                >
                  {user.email}
                </Typography>
              )}
              
              <IconButton
                onClick={handleMenu}
                sx={{
                  p: 0.5,
                  border: '2px solid rgba(123, 97, 255, 0.3)',
                  '&:hover': {
                    border: '2px solid rgba(123, 97, 255, 0.5)',
                  },
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(123, 97, 255, 0.1)',
                    color: '#7B61FF',
                    width: 32,
                    height: 32,
                  }}
                >
                  {user.email?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                  sx: {
                    bgcolor: '#242642',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    mt: 1.5,
                    minWidth: 200,
                    '& .MuiMenuItem-root': {
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      py: 1,
                      px: 2,
                      '&:hover': {
                        bgcolor: '#2D2F52',
                      },
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {isMobile && navItems.map((item) => (
                  <MenuItem 
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: location.pathname === item.path ? '#7B61FF' : 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        bgcolor: '#2D2F52',
                      },
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </MenuItem>
                ))}
                <MenuItem 
                  onClick={handleLogout}
                  sx={{
                    color: '#FF6B8A',
                    '&:hover': {
                      bgcolor: 'rgba(255, 107, 138, 0.1)',
                    },
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button 
              color="inherit" 
              onClick={() => navigate('/login')}
              sx={{
                color: '#7B61FF',
                '&:hover': {
                  bgcolor: 'rgba(123, 97, 255, 0.1)',
                },
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar; 