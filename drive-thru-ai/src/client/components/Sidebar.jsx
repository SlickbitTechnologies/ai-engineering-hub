import { Box, List, ListItem, ListItemIcon, ListItemText, Typography, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChatIcon from '@mui/icons-material/Chat';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import DriveEtaIcon from '@mui/icons-material/DriveEta';

// Animation variants
const sidebarVariants = {
  hidden: { x: -240 },
  visible: { 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Ordering Simulation',
      icon: <ChatIcon />,
      path: '/',
      description: 'Simulate drive-thru ordering experience'
    },
    {
      text: 'Order Display',
      icon: <RestaurantIcon />,
      path: '/orders',
      description: 'View and manage active orders'
    },
    {
      text: 'Menu Management',
      icon: <MenuBookIcon />,
      path: '/menu',
      description: 'Manage menu items and categories'
    }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <Box
        sx={{
          width: 240,
          backgroundColor: '#FFF',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          borderRight: '1px solid #EEE',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            borderBottom: '1px solid #EEE'
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              // transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <DriveEtaIcon sx={{ color: '#ff5722', fontSize: 32 }} />
            </motion.div>
            <Box>
              <Typography variant="h6" sx={{ 
                color: '#ff5722', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                Drive
                <FastfoodIcon sx={{ fontSize: 20 }} />
              </Typography>
              <Typography variant="caption" sx={{ color: '#2a3447' }}>
                Restaurant Management
              </Typography>
            </Box>
          </Box>
        </motion.div>

        <List sx={{ p: 1, flexGrow: 1 }}>
          <AnimatePresence>
            {menuItems.map((item, index) => (
              <motion.div
                key={item.text}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* <Tooltip title={item.description} placement="right"> */}
                  <ListItem
                    button
                    onClick={() => navigate(item.path)}
                    sx={{
                      backgroundColor: location.pathname === item.path ? '#2a3447' : 'transparent',
                      color: location.pathname === item.path ? '#FFF' : '#2a3447',
                      borderRadius: 2,
                      mb: 1,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#2a3447',
                        color: '#FFF',
                        '&::before': {
                          transform: 'translateX(0)'
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 4,
                        height: '100%',
                        backgroundColor: '#ff5722',
                        transform: location.pathname === item.path ? 'translateX(0)' : 'translateX(-4px)',
                        transition: 'transform 0.3s ease'
                      }
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: 'inherit',
                        minWidth: 40,
                        transition: 'transform 0.3s ease',
                        transform: location.pathname === item.path ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        {item.icon}
                      </motion.div>
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: location.pathname === item.path ? 400 : 400,
                        }
                      }}
                    />
                  </ListItem>
                {/* </Tooltip> */}
              </motion.div>
            ))}
          </AnimatePresence>
        </List>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid #EEE',
            textAlign: 'center'
          }}>
            <Typography variant="caption" sx={{ color: '#2a3447' }}>
              © 2024 Drive-Thru System
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default Sidebar; 