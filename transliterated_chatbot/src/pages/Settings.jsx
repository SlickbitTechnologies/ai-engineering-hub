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
  Skeleton,
  Snackbar,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Fade,
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

const LoadingSkeleton = () => (
  <Box
    sx={{
      minHeight: '100vh',
      p: 3,
      bgcolor: '#1A1B2E',
    }}
  >
    <Fade in={true}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          bgcolor: '#242642',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Tabs Skeleton */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)', p: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[1, 2].map((tab) => (
              <Skeleton
                key={tab}
                variant="rounded"
                width={100}
                height={40}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Title Skeleton */}
          <Skeleton
            variant="text"
            width={250}
            height={40}
            sx={{ 
              mb: 3,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }}
          />

          {/* Form Fields Skeleton */}
          {[1, 2].map((field) => (
            <Skeleton
              key={field}
              variant="rounded"
              width="100%"
              height={56}
              sx={{ 
                mb: 2,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          ))}

          {/* Button Skeleton */}
          <Skeleton
            variant="rounded"
            width={120}
            height={40}
            sx={{ 
              mt: 2,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }}
          />

          {/* Content Section Skeleton */}
          <Box sx={{ mt: 4 }}>
            <Skeleton
              variant="rounded"
              width="100%"
              height={48}
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }}
            />

            <Skeleton
              variant="rounded"
              width="100%"
              height={300}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Fade>
  </Box>
);

const Settings = () => {
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

  return (
    <>
      <AppBar />
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <Box
          sx={{
            minHeight: '100vh',
            p: 3,
            bgcolor: '#1A1B2E',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              maxWidth: 1200,
              mx: 'auto',
              bgcolor: '#242642',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <Tabs 
                value={activeTab} 
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-selected': {
                      color: '#7B61FF',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    bgcolor: '#7B61FF',
                  },
                }}
              >
                <Tab label="Profile" />
                <Tab label="Content" />
              </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 3,
                  }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      Restaurant Profile
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      sx={{
                        bgcolor: '#7B61FF',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: '#6344FF',
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'rgba(123, 97, 255, 0.3)',
                        },
                      }}
                    >
                      {saveMutation.isPending ? <Skeleton width={120} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} /> : 'Save Changes'}
                    </Button>
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="Restaurant Name"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    margin="normal"
                    sx={textFieldStyle}
                  />

                  <FormControl 
                    fullWidth 
                    margin="normal"
                    sx={textFieldStyle}
                  >
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      label="Language"
                    >
                      {SUPPORTED_LANGUAGES.map((option) => (
                        <MenuItem 
                          key={option.value} 
                          value={option.value}
                          sx={{
                            borderRadius: '8px',
                            mx: 0.5,
                            my: 0.2,
                            color: '#FFFFFF',
                            '&:hover': {
                              bgcolor: '#2D2F52',
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(123, 97, 255, 0.1)',
                              color: '#7B61FF',
                              '&:hover': {
                                bgcolor: 'rgba(123, 97, 255, 0.2)',
                              },
                            },
                          }}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 3,
                  }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      Restaurant Content
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleSaveContent}
                      disabled={saveContentMutation.isPending}
                      sx={{
                        bgcolor: '#7B61FF',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: '#6344FF',
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'rgba(123, 97, 255, 0.3)',
                        },
                      }}
                    >
                      {saveContentMutation.isPending ? <Skeleton width={120} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} /> : 'Save Files'}
                    </Button>
                  </Box>

                  <Box sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: '#2D2F52',
                    p: 1,
                  }}>
                    <Tabs 
                      value={activeFileTab} 
                      onChange={(_, newValue) => setActiveFileTab(newValue)}
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{
                        minHeight: '48px',
                        '& .MuiTab-root': {
                          minHeight: '48px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.95rem',
                          textTransform: 'none',
                          borderRadius: 1.5,
                          mx: 0.5,
                          '&.Mui-selected': {
                            color: '#7B61FF',
                            bgcolor: 'rgba(123, 97, 255, 0.1)',
                          },
                          '&:hover': {
                            bgcolor: 'rgba(123, 97, 255, 0.05)',
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
                          label={tab.label}
                          icon={React.cloneElement(tab.icon, { 
                            sx: { 
                              fontSize: 20,
                              mr: 1,
                              color: activeFileTab === fileUploadTabs.indexOf(tab) ? '#7B61FF' : 'inherit',
                            } 
                          })}
                          iconPosition="start"
                        />
                      ))}
                    </Tabs>
                  </Box>

                  <Box 
                    sx={{ 
                      p: 3,
                      border: '2px dashed rgba(123, 97, 255, 0.3)',
                      borderRadius: 2,
                      bgcolor: 'rgba(123, 97, 255, 0.05)',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        borderColor: 'rgba(123, 97, 255, 0.5)',
                        bgcolor: 'rgba(123, 97, 255, 0.08)',
                      },
                    }}
                  >
                    <FileUploadZone 
                      title={`Upload ${fileUploadTabs[activeFileTab].label}`}
                      description={fileUploadTabs[activeFileTab].description}
                      icon={fileUploadTabs[activeFileTab].icon}
                      file={files[fileUploadTabs[activeFileTab].key]}
                      onUpload={handleFileUpload(fileUploadTabs[activeFileTab].key)}
                      onDelete={handleFileDelete(fileUploadTabs[activeFileTab].key)}
                      accept=".pdf"
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity}
              sx={{
                bgcolor: snackbar.severity === 'success' 
                  ? 'rgba(76, 217, 100, 0.9)'
                  : 'rgba(255, 107, 138, 0.9)',
                color: '#FFFFFF',
                '& .MuiAlert-icon': {
                  color: '#FFFFFF',
                },
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      )}
    </>
  );
};

const textFieldStyle = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#2D2F52',
    borderRadius: 2,
    color: '#FFFFFF',
    '& fieldset': {
      borderColor: 'rgba(123, 97, 255, 0.2)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(123, 97, 255, 0.3)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#7B61FF',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#7B61FF',
    },
  },
  '& .MuiSelect-icon': {
    color: '#7B61FF',
  },
};

export default Settings; 