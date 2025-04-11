import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Fade,
  Zoom,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';

// Add these animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const orderCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5
    }
  },
  hover: {
    y: -5,
    boxShadow: "0px 8px 15px rgba(0,0,0,0.1)",
    transition: {
      duration: 0.3
    }
  }
};

const OrderDisplay = () => {
  const [orders, setOrders] = useState([
    // {
    //   id: 2,
    //   status: 'new',
    //   timestamp: '16:46',
    //   vehicle: 'Red SUV',
    //   total: 22.97,
    //   items: [
    //     {
    //       name: 'Burger Combo',
    //       quantity: 2,
    //       price: 19.98,
    //       customizations: [
    //         'Large Fries and Drink',
    //         'No tomato'
    //       ]
    //     },
    //     {
    //       name: 'Ice Cream',
    //       quantity: 1,
    //       price: 2.99,
    //       customizations: [
    //         'Chocolate Sauce'
    //       ]
    //     }
    //   ]
    // },
    // {
    //   id: 3,
    //   status: 'preparing',
    //   timestamp: '16:48',
    //   vehicle: 'Blue pickup truck',
    //   total: 13.98,
    //   items: [
    //     {
    //       name: 'Cheese Burger',
    //       quantity: 1,
    //       price: 6.99,
    //       customizations: [
    //         'Extra Patty',
    //         'Bacon'
    //       ]
    //     },
    //     {
    //       name: 'French Fries',
    //       quantity: 1,
    //       price: 2.99,
    //       customizations: [
    //         'Large'
    //       ]
    //     }
    //   ]
    // }
  ]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      const updatedOrders = response.data.map(order => {
        // Calculate the total price for the order, including customizations
        const total = order.items.reduce((sum, item) => {
          // Ensure customization is an array
          const customizationArray = Array.isArray(item.customization) ? item.customization : [];
  
          // Calculate the total price for customizations
          const customizationTotal = customizationArray.reduce((custSum, cust) => {
            return custSum + (parseFloat(cust.price) || 0); // Ensure cust.price is a valid number
          }, 0);
  
          // Calculate the total price for the item
          const itemPrice = parseFloat(item.price) || 0; // Ensure item.price is a valid number
          const quantity = item.quantity || 1; // Default quantity to 1 if not specified
          const itemTotal = (itemPrice + customizationTotal) * quantity;
  
          console.log(`Item: ${item.name}, Price: ${itemPrice}, Customization Total: ${customizationTotal}, Quantity: ${quantity}, Item Total: ${itemTotal}`);
  
          return sum + itemTotal;
        }, 0);
  
        return {
          ...order,
          total: total.toFixed(2) // Ensure total is formatted to 2 decimal places
        };
      });
  
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      await axios.put(`/api/orders/${orderId}/${action}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getOrderBackgroundColor = (status) => {
    switch (status) {
      case 'new':
        return '#e8f1ff'; // Light blue from image
      case 'preparing':
        return '#fff5e6'; // Light yellow from image
      default:
        return '#ffffff';
    }
  };

  const getActionButton = (order) => {
    switch (order.status) {
      case 'new':
        return (
          <Button
            variant="contained"
            onClick={() => handleOrderAction(order.id, 'start')}
            sx={{
              bgcolor: '#2196f3',
              color: 'white',
              '&:hover': { bgcolor: '#1976d2' },
              borderRadius: '8px',
              textTransform: 'none',
              px: 3
            }}
          >
            Start Preparing
          </Button>
        );
      case 'preparing':
        return (
          <Button
            variant="contained"
            onClick={() => handleOrderAction(order.id, 'complete')}
            sx={{
              bgcolor: '#4caf50',
              color: 'white',
              '&:hover': { bgcolor: '#388e3c' },
              borderRadius: '8px',
              textTransform: 'none',
              px: 3
            }}
          >
            Complete Order
          </Button>
        );
      default:
        return null;
    }
  };
  return (
    <Fade in timeout={800}>
      <Box sx={{ p: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Kitchen Display
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                View and manage active orders for the kitchen
              </Typography>
            </Box>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={3}>
              <AnimatePresence>
                {orders.map((order) => (
                  <Grid item xs={12} sm={3.8} key={order.id}>
                    <motion.div
                      variants={orderCardVariants}
                      whileHover="hover"
                      layout
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          bgcolor: getOrderBackgroundColor(order.status),
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '1px solid #EEE',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* Order Header */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Box sx={{ 
                            p: 2, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Order #{order.id}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                              <Typography color="text.secondary">{order.timestamp}</Typography>
                            </Box>
                          </Box>
                        </motion.div>

                        {/* Vehicle Info */}
                        <Zoom in timeout={500}>
                          <Box sx={{ px: 2, py: 1, bgcolor: '#FFF' }}>
                            {/* <Typography variant="body2" color="text.secondary">
                              Vehicle: {order.vehicle}
                            </Typography> */}
                          </Box>
                        </Zoom>

                        {/* Order Items */}
                        <Box sx={{ p: 2, bgcolor: '#FFF' }}>
                          {order.items.map((item, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Box sx={{ mb: index !== order.items.length - 1 ? 2 : 0 }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  mb: 0.5
                                }}>
                                  <Typography>
                                    {item.name} × {item.quantity}
                                  </Typography>
                                  <Typography>
                                    ${item.price.toFixed(2)}
                                  </Typography>
                                </Box>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'start',
                                  flexDirection:'column',
                                  textAlign: 'left',
                                  mb: 0.5,
                                  ml: 3
                                }}>
                                {item?.customization?.map((customization, custIndex) => (
                                  <motion.div
                                    key={custIndex}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: custIndex * 0.1 + 0.2 }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: '#ff5722',
                                        ml: 0,
                                        '&::before': {
                                          content: '"•"',
                                          marginRight: '4px'
                                        }
                                      }}
                                    >
                                      {customization.name} (${parseFloat(customization.price).toFixed(2)})
                                    </Typography>
                                  </motion.div>
                                ))}
                                </Box>
                              </Box>
                            </motion.div>
                          ))}
                        </Box>

                        {/* Order Total and Action */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Box sx={{ 
                            p: 2,
                            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center', 
                            bgcolor: '#FFF'
                          }}>
                            <Grid>
                              <Box sx={{display:'flex', flexDirection: 'row', alignItems:'center'}}>
                                <Typography variant="body2" color="text.secondary">Sub Total:</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  ${parseFloat(order.total).toFixed(2)}
                                </Typography>
                              </Box>
                              <Box sx={{display:'flex', flexDirection: 'row', alignItems:'center'}}>
                                <Typography variant="body2" color="text.secondary">Total:</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  ${parseFloat(order.total * 1.08).toFixed(2)}
                                </Typography>
                              </Box>
                            </Grid>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              {getActionButton(order)}
                            </motion.div>
                          </Box>
                        </motion.div>
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
          </motion.div>
        </Box>
      </Box>
    </Fade>
  );
};

export default OrderDisplay; 