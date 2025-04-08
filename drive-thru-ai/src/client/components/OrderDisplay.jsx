import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';

const OrderDisplay = () => {
  const [orders, setOrders] = useState([
    {
      id: 2,
      status: 'new',
      timestamp: '16:46',
      vehicle: 'Red SUV',
      total: 22.97,
      items: [
        {
          name: 'Burger Combo',
          quantity: 2,
          price: 19.98,
          customizations: [
            'Large Fries and Drink',
            'No tomato'
          ]
        },
        {
          name: 'Ice Cream',
          quantity: 1,
          price: 2.99,
          customizations: [
            'Chocolate Sauce'
          ]
        }
      ]
    },
    {
      id: 3,
      status: 'preparing',
      timestamp: '16:48',
      vehicle: 'Blue pickup truck',
      total: 13.98,
      items: [
        {
          name: 'Cheese Burger',
          quantity: 1,
          price: 6.99,
          customizations: [
            'Extra Patty',
            'Bacon'
          ]
        },
        {
          name: 'French Fries',
          quantity: 1,
          price: 2.99,
          customizations: [
            'Large'
          ]
        }
      ]
    }
  ]);

  console.log(orders, 'sdkhjkhsdf')
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      // setOrders(response.data);
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
    <Box sx={{ p: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Kitchen Display
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View and manage active orders for the kitchen
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} sm={3} key={order.id}>
              <Paper
                elevation={0}
                sx={{
                  bgcolor: getOrderBackgroundColor(order.status),
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #EEE'
                }}
              >
                {/* Order Header */}
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

                {/* Vehicle Info */}
                <Box sx={{ px: 2, py: 1, bgcolor: '#FFF' }}>
                  <Typography variant="body2" color="text.secondary">
                    Vehicle: {order.vehicle}
                  </Typography>
                </Box>

                {/* Order Items */}
                <Box sx={{ p: 2, bgcolor: '#FFF' }}>
                  {order.items.map((item, index) => (
                    <Box key={index} sx={{ mb: index !== order.items.length - 1 ? 2 : 0 }}>
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
                      {item.customizations.map((customization, custIndex) => (
                        <Typography
                          key={custIndex}
                          variant="body2"
                          sx={{
                            color: '#ff5722',
                            ml: 2,
                            '&::before': {
                              content: '"•"',
                              marginRight: '4px'
                            }
                          }}
                        >
                          {customization}
                        </Typography>
                      ))}
                    </Box>
                  ))}
                </Box>

                {/* Order Total and Action */}
                <Box sx={{ 
                  p: 2,
                  borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center', 
                  bgcolor: '#FFF'
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      ${order.total.toFixed(2)}
                    </Typography>
                  </Box>
                  {getActionButton(order)}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default OrderDisplay; 