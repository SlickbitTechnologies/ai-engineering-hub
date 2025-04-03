import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  MenuItem,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ReviewsIcon from '@mui/icons-material/Reviews';
import { useMutation, useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '../components/AppBar';
import { useDropzone } from 'react-dropzone';

const SUPPORTED_LANGUAGES = [
  { value: 'telugu', label: 'Telugu' },
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'hindi', label: 'Hindi' },
];

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          p: 4,
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          margin: '24px 0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function FileUploadZone({ title, description, icon, onUpload, onDelete, file, accept = ".pdf" }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, curr) => ({ ...acc, [curr]: [] }), {}),
    maxFiles: 1,
  });
  const fileName = useMemo(() => {
    if(typeof file === 'string') {
      return file.split('?')[0].split('%2F').pop();
    }
    return file?.name;
  }, [file]);
  console.log("file", file);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 2,
        bgcolor: '#fff',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: file ? 'auto' : 400,
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        border: '2px dashed',
        borderColor: isDragActive ? '#178582' : 'rgba(23, 133, 130, 0.2)',
        '&:hover': {
          borderColor: '#178582',
          boxShadow: '0 12px 24px rgba(23, 133, 130, 0.1)',
        },
      }}
      {...(!file ? getRootProps() : {})}
    >
      {!file ? (
        <>
          <input {...getInputProps()} />
          {React.cloneElement(icon, { 
            sx: { 
              fontSize: 64, 
              color: isDragActive ? '#178582' : 'rgba(23, 133, 130, 0.8)',
              mb: 3,
              opacity: 0.8,
            } 
          })}
          <Typography variant="h5" sx={{ mb: 2, color: '#0A1828', fontWeight: 600 }}>
            {isDragActive ? 'Drop the file here' : title}
          </Typography>
          <Typography variant="body1" sx={{ color: '#0A1828', opacity: 0.7, textAlign: 'center', maxWidth: '80%', mb: 3 }}>
            {description}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: '#BFA181',
            bgcolor: 'rgba(191, 161, 129, 0.1)',
            p: 2,
            borderRadius: '8px',
          }}>
            <UploadFileIcon />
            <Typography variant="body2">
              Drag & drop or click to upload
            </Typography>
          </Box>
        </>
      ) : (
        <Box sx={{ 
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2,
          px: 3,
          bgcolor: 'rgba(23, 133, 130, 0.05)',
          borderRadius: '12px',
        }}>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: 1,
          }}>
            <UploadFileIcon sx={{ color: '#178582', fontSize: 24 }} />
            <Box>
              <Typography
                sx={{
                  color: '#0A1828',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                }}
              >
                {fileName}
              </Typography>
              {
                typeof file !== 'string' && (
                  <Typography
                variant="caption"
                sx={{
                  color: '#BFA181',
                }}
              >
                {formatFileSize(file.size)}
              </Typography>
                )
              }
              
            </Box>
          </Box>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{
              p: 0.5,
              color: '#0A1828',
              opacity: 0.6,
              '&:hover': { 
                color: '#FF3B30',
                bgcolor: 'rgba(255, 59, 48, 0.1)',
              },
            }}
          >
            <DeleteIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      )}
    </Paper>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeFileTab, setActiveFileTab] = useState(0);
  const { user } = useAuth();
  const [restaurantName, setRestaurantName] = useState('');
  const [language, setLanguage] = useState('telugu');
  const [files, setFiles] = useState({
    menu: null,
    reviews: null,
    faqs: null,
    history: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings data when component mounts
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await restaurantApi.getSettings(user?.uid);
        console.log('Fetched settings:', data);
        
        if (data) {
          setRestaurantName(data.name || '');
          setLanguage(data.language || 'telugu');
          setFiles({
            menu: data.files?.menu || null,
            reviews: data.files?.reviews || null,
            faqs: data.files?.faqs || null,
            history: data.files?.history || null,
          });
          
          // If there are file URLs in the data, you might want to handle them here
          // For example, you could fetch the files or store their URLs
          // if (data.menuUrl) console.log('Menu URL:', data.menuUrl);
          // if (data.reviewsUrl) console.log('Reviews URL:', data.reviewsUrl);
          // if (data.faqsUrl) console.log('FAQs URL:', data.faqsUrl);
          // if (data.historyUrl) console.log('History URL:', data.historyUrl);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load settings',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.uid) {
      fetchSettings();
    }
  }, [user?.uid]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (settings) => restaurantApi.updateSettings(user?.uid, settings),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error',
      });
    },
  });

  // Save content mutation
  const saveContentMutation = useMutation({
    mutationFn: async (contentData) => {
      const formData = new FormData();
      formData.append('restaurantName', restaurantName);
      formData.append('language', language);
      
      // Append files if they exist
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });
      
      return restaurantApi.saveSettings( formData);
    },
    onSuccess: (data) => {
      console.log("data", data);
      setSnackbar({
        open: true,
        message: 'Content saved successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      console.error('Error saving content:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save content',
        severity: 'error',
      });
    },
  });

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        restaurantName,
        language,
      });
    } catch (error) {
      console.error('Error in handleSave:', error);
    }
  };

  const handleSaveContent = async () => {
    try {
      await saveContentMutation.mutateAsync();
    } catch (error) {
      console.error('Error in handleSaveContent:', error);
    }
  };

  const handleFileUpload = (type) => (file) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleFileDelete = (type) => () => {
    setFiles(prev => ({ ...prev, [type]: null }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fileUploadTabs = [
    {
      label: "Menu",
      icon: <RestaurantMenuIcon />,
      description: "Upload menu items",
     
      key: "menu"
    },
    {
      label: "Reviews",
      icon: <ReviewsIcon />,
      description: "Upload customer reviews and feedback",
      key: "reviews"
    },
    {
      label: "FAQs",
      icon: <QuestionAnswerIcon />,
      description: "Upload frequently asked questions and answers",
      key: "faqs"
    },
    {
      label: "Chat History",
      icon: <HistoryIcon />,
      description: "Upload previous chat conversations for training",
      key: "history"
    }
  ];

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Please log in to access settings</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppBar  />
      <Box sx={{ 
        width: '100%', 
        p: 4,
        backgroundColor: 'rgba(10, 24, 40, 0.02)',
        minHeight: 'calc(100vh - 64px)',
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Box sx={{ 
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            width: 'fit-content',
            padding: '6px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            mb: 3,
          }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  minWidth: '180px',
                  borderRadius: '12px',
                  textTransform: 'none',
                  color: '#666666',
                  fontSize: '15px',
                  fontWeight: 500,
                  py: 1.5,
                  '&.Mui-selected': {
                    color: '#007AFF',
                    backgroundColor: '#f0f9ff',
                  },
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              <Tab label="Profile" />
              <Tab label="Content" />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ maxWidth: 600 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 4 
              }}>
                <Typography variant="h5" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                  Restaurant Profile
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  sx={{
                    bgcolor: '#178582',
                    color: 'white',
                    borderRadius: '12px',
                    px: 4,
                    py: 1,
                    '&:hover': {
                      bgcolor: '#0f5f5c',
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(23, 133, 130, 0.5)',
                    },
                  }}
                >
                  {saveMutation.isPending ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </Box>
              <label htmlFor="restaurant-name" style={{color:'black'}}>Restaurant Name</label>
              <TextField
                fullWidth
                id="restaurant-name"
                // label="Restaurant Name"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                sx={{ 
                  mb: 3,
                  borderColor:'black',
                  backgroundColor:'#f1f1f1',
                  borderRadius: '12px',
                  color: 'black',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    color: 'black',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'black',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'black',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#007AFF',
                  },
                }}
              />
              <label htmlFor="default-language" style={{color:'black'}}>Select Translation Language</label>
              <TextField
                fullWidth
                select
                // label="Default Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                sx={{ 
                  backgroundColor:'#f1f1f1',
                  borderRadius: '12px',
                  color: 'black',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    color:'black',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'black',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'black',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#007AFF',
                  },
                }}
              >
                {SUPPORTED_LANGUAGES.map((option) => (
                  <MenuItem 
                    key={option.value} 
                    value={option.value}
                    sx={{
                      borderRadius: '8px',
                      mx: 0.5,
                      my: 0.2,
                      backgroundColor:'#f1f1f1',
                      color: 'black',
                      '&:hover': {
                        // backgroundColor: '#f0f9ff',
                      },
                      '&.Mui-selected': {
                        // backgroundColor: '#f0f9ff',
                        color: 'black',
                        '&:hover': {
                          backgroundColor: '#e0f2fe',
                        },
                      },
                    }}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3 
              }}>
                <Box>
                  <Typography variant="h6" sx={{ color: '#0A1828', fontWeight: 600, mb: 1 }}>
                    {fileUploadTabs[activeFileTab].label} Files
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#0A1828', opacity: 0.7 }}>
                    {fileUploadTabs[activeFileTab].description}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleSaveContent}
                  disabled={saveContentMutation.isPending}
                  sx={{
                    bgcolor: '#178582',
                    color: 'white',
                    borderRadius: '12px',
                    px: 4,
                    py: 1,
                    '&:hover': {
                      bgcolor: '#0f5f5c',
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(23, 133, 130, 0.5)',
                    },
                  }}
                >
                  {saveContentMutation.isPending ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Save Content'
                  )}
                </Button>
              </Box>

              <Box sx={{ 
                borderRadius: '16px',
                backgroundColor: '#fff',
                width: 'fit-content',
                padding: '6px',
                boxShadow: '0 2px 12px rgba(10, 24, 40, 0.08)',
                mb: 3,
              }}>
                <Tabs 
                  value={activeFileTab} 
                  onChange={(_, newValue) => setActiveFileTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: '42px',
                    '& .MuiTab-root': {
                      minWidth: '180px',
                      borderRadius: '12px',
                      textTransform: 'none',
                      color: '#0A1828',
                      fontSize: '15px',
                      fontWeight: 500,
                      py: 1,
                      minHeight: '42px',
                      opacity: 0.7,
                      '&.Mui-selected': {
                        color: '#178582',
                        backgroundColor: 'rgba(23, 133, 130, 0.05)',
                        opacity: 1,
                      },
                    },
                    '& .MuiTabs-indicator': {
                      display: 'none',
                    },
                  }}
                >
                  {fileUploadTabs.map((tab) => (
                    <Tab 
                      key={tab.key}
                      icon={React.cloneElement(tab.icon, { 
                        sx: { 
                          fontSize: 20,
                          mr: 1,
                          color: activeFileTab === fileUploadTabs.indexOf(tab) ? '#178582' : '#0A1828',
                          opacity: activeFileTab === fileUploadTabs.indexOf(tab) ? 1 : 0.7,
                        } 
                      })}
                      iconPosition="start"
                      label={tab.label}
                    />
                  ))}
                </Tabs>
              </Box>

              {fileUploadTabs.map((tab, index) => (
                <TabPanel key={tab.key} value={activeFileTab} index={index}>
                  <FileUploadZone
                    title={`Upload ${tab.label}`}
                    description={tab.description}
                    icon={tab.icon}
                    file={files[tab.key]}
                    onUpload={handleFileUpload(tab.key)}
                    onDelete={handleFileDelete(tab.key)}
                    accept={tab.accept}
                  />
                </TabPanel>
              ))}
            </Box>
          </TabPanel>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              variant="filled"
              sx={{ 
                borderRadius: '12px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </>
  );
} 