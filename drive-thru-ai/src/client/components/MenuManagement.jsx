import { useEffect, useState } from 'react';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import panCake from '../assets/panCake.png';

// const categories = ['Burgers', 'Sides', 'Drinks', 'Desserts', 'Combos'];

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
    const response = await axios.post('/api/menu-items', { obj });
    console.log(response, 'responseresponsesdsd')
    if(response.status === 200) {
      handleClose()
      fetchMenuItems()
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Menu Management</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your restaurant's menu items and categories
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            bgcolor: '#ff5722',
            '&:hover': { bgcolor: '#f4511e' },
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          Add Menu Item
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Menu Items" />
          <Tab label="Categories" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "contained" : "outlined"}
                onClick={() => handleCategoryClick(category)}
                sx={{
                  bgcolor: selectedCategory === category ? '#1a237e' : 'transparent',
                  color: selectedCategory === category ? 'white' : 'inherit',
                  '&:hover': {
                    bgcolor: selectedCategory === category ? '#0d47a1' : 'rgba(0, 0, 0, 0.04)'
                  },
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                {category}
              </Button>
            ))}
          </Stack>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {menuItems
              .filter(item => item.category === selectedCategory)
              .map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h6">{item.name}</Typography>
                        <Switch
                          checked={item.available}
                          onChange={() => handleAvailabilityChange(item.id)}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Available
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <img src={panCake} alt="Delicious Burger" style={{ width: '50px' }} />
                      <Grid>
                        <Typography variant="h6" color="primary" gutterBottom>
                          ${item.price.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {item.category}
                        </Typography>
                      </Grid>
                      </Box>

                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {item.description}
                      </Typography>
                      
                      {item?.customizations?.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Customizations:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {item.customizations.map((custom, index) => (
                              <Typography key={index} variant="body2" color="text.secondary">
                                {custom.name} (+${custom.price.toFixed(2)})
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => handleOpen(item)}
                        sx={{ textTransform: 'none' }}
                      >
                        Edit
                      </Button>
                      <Button
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleDelete(item.id)}
                        sx={{ textTransform: 'none' }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
          </Box>
        </>
      )}

      {tabValue === 1 && (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Menu Categories</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: '#1a237e',
                '&:hover': { bgcolor: '#0d47a1' },
                borderRadius: 2,
                textTransform: 'none'
              }}
              onClick={() => {/* TODO: Implement add category */}}
            >
              Add Category
            </Button>
          </Box>

          <Stack spacing={2}>
            {categories.map((category, index) => (
              <Paper
                key={category}
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {category}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Position: {index + 1}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => {/* TODO: Implement edit */}}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {/* TODO: Implement delete */}}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            autoFocus
            margin="dense"
            label="category"
            fullWidth
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveMenuItem}>
            {editItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuManagement; 