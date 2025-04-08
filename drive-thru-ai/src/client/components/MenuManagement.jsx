import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  Switch,
  IconButton,
  Grid,
  Fade,
  Zoom,
  Tooltip,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import axios from 'axios';
import panCake from '../assets/panCake.png';

// const categories = ['Burgers', 'Sides', 'Drinks', 'Desserts', 'Combos'];

const PageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: '#f5f5f5',
  minHeight: '100vh',
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
  color: 'white',
  boxShadow: theme.shadows[4],
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const CategoryButton = styled(Button)(({ theme, selected }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  padding: theme.spacing(1, 3),
  transition: 'all 0.3s ease',
  backgroundColor: selected ? theme.palette.primary.main : 'transparent',
  color: selected ? 'white' : theme.palette.text.primary,
  '&:hover': {
    transform: 'translateY(-2px)',
    backgroundColor: selected ? theme.palette.primary.dark : theme.palette.action.hover,
  },
}));

const MenuItemCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const AnimatedIconButton = styled(IconButton)(({ theme }) => ({
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: 'Classic Burger',
      price: 5.99,
      category: 'Burgers',
      description: 'Beef patty with lettuce, tomato, onion, and special sauce',
      available: true,
      customizations: [
        { name: 'Extra Patty', price: 2.50 },
        { name: 'Cheese', price: 0.50 },
        { name: 'Bacon', price: 1.50 }
      ]
    },
    {
      id: 2,
      name: 'Cheese Burger',
      price: 6.99,
      category: 'Burgers',
      description: 'Beef patty with American cheese, lettuce, tomato, onion, and special sauce',
      available: true,
      customizations: [
        { name: 'Extra Patty', price: 2.50 },
        { name: 'Bacon', price: 1.50 }
      ]
    }
  ]);
  
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    available: true,
    customizations: []
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu-items');
      console.log(response, 'sdfsdfresponse')
      setMenuItems(response.data);
      const filterCat = [...new Set(response.data.map(item => item.category))];
      setCategories(filterCat)
      setSelectedCategory(filterCat[0])
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCategories = async () => {
    const response = await axios.get('/api/categories');
    console.log(response, 'sdkhskdfjh')
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleAvailabilityChange = async (itemId) => {
    const updatedItems = menuItems.map(item => {
      if (item.id === itemId) {
        return { ...item, available: !item.available };
      }
      return item;
    });
    setMenuItems(updatedItems);
    // TODO: Update availability in backend
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData(item);
    } else {
      setEditItem(null);
      setFormData({
        name: '',
        price: '',
        description: '',
        category: selectedCategory,
        available: true,
        customizations: []
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/menu-items/${id}`);
        setMenuItems(menuItems.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  const handleSaveMenuItem = async() => {
    let obj = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description,
      category: formData.category,
      available: formData.available
    }
    const itemResponse = await axios.post('/api/menu-items', { obj });
    console.log(itemResponse, 'responseresponsesdsd')

    const categoryResponse = await axios.post('/api/categories', { name: formData.category });

    if(itemResponse.status === 200) {
      handleClose()
      fetchMenuItems()
    }
  }

  return (
    <PageContainer>
      <Fade in timeout={800}>
        <HeaderCard elevation={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <RestaurantMenuIcon sx={{ fontSize: 40 }} />
              </motion.div>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600, alignItems:'center', display:'flex' }}>
                  Menu Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                  Manage your restaurant's menu items and categories
                </Typography>
              </Box>
            </Box>
            <Zoom in timeout={500}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpen()}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    transform: 'scale(1.02)',
                  },
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                }}
              >
                Add Menu Item
              </Button>
            </Zoom>
          </Box>
        </HeaderCard>
      </Fade>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <StyledTab icon={<FastfoodIcon />} iconPosition="start" label="Menu Items" />
          <StyledTab icon={<CategoryIcon />} iconPosition="start" label="Categories" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Fade in timeout={500}>
          <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 4, px: 2 }}>
              {categories.map((category) => (
                <motion.div
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CategoryButton
                    selected={selectedCategory === category}
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category}
                  </CategoryButton>
                </motion.div>
              ))}
            </Stack>

            <Grid container spacing={3}>
              {menuItems
                .filter(item => item.category === selectedCategory)
                .map((item, index) => (
                  <Grid item xs={12} md={3} key={item.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <MenuItemCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* <Typography variant="body2" color="text.secondary">
                              Available
                            </Typography> */}
                            <Switch
                              checked={item.available}
                              onChange={() => handleAvailabilityChange(item.id)}
                              color="success"
                            />
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                          <img 
                            src={panCake} 
                            alt={item.name}
                            style={{ 
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '12px',
                            }} 
                          />
                          <Box>
                            <Typography variant="h5" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AttachMoneyIcon />
                              {item.price.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CategoryIcon sx={{ fontSize: 18 }} />
                              {item.category}
                            </Typography>
                          </Box>
                        </Box>

                        <Typography noWrap variant="body1" sx={{ 
                          mb: 2, 
                          display:'flex', 
                          alignItems:'flex-start', 
                          textAlign: 'left',
                          color: '#7b7878',
                          display: 'block', // display block or inline-block for text truncation
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%'
                        }}>
                          {item.description}
                        </Typography>

                        {item?.customizations?.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocalDiningIcon sx={{ fontSize: 18 }} />
                              Customizations:
                            </Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                              {item.customizations.map((custom, index) => (
                                <Chip
                                  key={index}
                                  label={`${custom.name} (+$${custom.price.toFixed(2)})`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Stack>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                          <Tooltip title="Edit Item">
                            <AnimatedIconButton
                              onClick={() => handleOpen(item)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon />
                            </AnimatedIconButton>
                          </Tooltip>
                          <Tooltip title="Delete Item">
                            <AnimatedIconButton
                              onClick={() => handleDelete(item.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon />
                            </AnimatedIconButton>
                          </Tooltip>
                        </Box>
                      </MenuItemCard>
                    </motion.div>
                  </Grid>
                ))}
            </Grid>
          </Box>
        </Fade>
      )}

      {tabValue === 1 && (
        <Fade in timeout={500}>
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <CategoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </motion.div>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Menu Categories
                </Typography>
              </Box>
              
              <Zoom in timeout={500}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    bgcolor: '#1a237e',
                    '&:hover': { 
                      bgcolor: '#0d47a1',
                      transform: 'scale(1.02)',
                    },
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                  }}
                  onClick={() => {/* TODO: Implement add category */}}
                >
                  Add Category
                </Button>
              </Zoom>
            </Box>

            <Stack spacing={2}>
              {categories.map((category, index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: 4,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <DragIndicatorIcon sx={{ color: 'text.secondary', cursor: 'grab' }} />
                      <Box>
                        <Typography variant="h6" sx={{ color: 'primary.main' }}>
                          {category}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Position: {index + 1}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit Category">
                        <AnimatedIconButton
                          size="small"
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <EditIcon />
                        </AnimatedIconButton>
                      </Tooltip>
                      <Tooltip title="Delete Category">
                        <AnimatedIconButton
                          size="small"
                          sx={{ 
                            bgcolor: 'error.light',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'error.main',
                            }
                          }}
                        >
                          <DeleteIcon />
                        </AnimatedIconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Stack>
          </Box>
        </Fade>
      )}

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 500 }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          bgcolor: 'primary.main',
          color: 'white'
        }}>
          <FastfoodIcon />
          {editItem ? 'Edit Menu Item' : 'Add Menu Item'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              InputProps={{
                startAdornment: <FastfoodIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              label="Category"
              fullWidth
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              InputProps={{
                startAdornment: <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              label="Price"
              type="number"
              fullWidth
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              InputProps={{
                startAdornment: <AttachMoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              InputProps={{
                startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveMenuItem}
            sx={{
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            {editItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default MenuManagement; 