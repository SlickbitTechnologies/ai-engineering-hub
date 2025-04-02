import React, { useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HistoryIcon from '@mui/icons-material/History';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ReviewsIcon from '@mui/icons-material/Reviews';
import SaveIcon from '@mui/icons-material/Save';
import { useMutation, useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const SUPPORTED_LANGUAGES = [
  { value: 'telugu', label: 'Telugu' },
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'hindi', label: 'Hindi' },
];

function FileUploadButton({ icon, label, onChange, disabled }) {
  const fileInputRef = useRef(null);

  return (
    <>
      <Button
        fullWidth
        variant="outlined"
        startIcon={icon}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        sx={{
          mb: 2,
          borderColor: 'rgba(0, 122, 255, 0.2)',
          color: '#007AFF',
          justifyContent: 'flex-start',
          '&:hover': {
            borderColor: '#007AFF',
            bgcolor: 'rgba(0, 122, 255, 0.05)',
          },
        }}
      >
        {label}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </>
  );
}

function FileItem({ file, onDelete, icon }) {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 1.5,
        mb: 1,
        bgcolor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          {file.name}
        </Typography>
        <Tooltip title="Remove file">
          <IconButton
            size="small"
            onClick={onDelete}
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              '&:hover': { color: '#FF3B30' },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}

function RestaurantSettings() {
  const { user } = useAuth();
  const [restaurantName, setRestaurantName] = useState('');
  const [language, setLanguage] = useState('telugu');
  const [files, setFiles] = useState({
    history: null,
    faqs: null,
    menu: null,
    reviews: null,
  });
  const [showErrors, setShowErrors] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch existing settings
  const { data: existingSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['restaurantSettings', user?.uid],
    queryFn: () => restaurantApi.getSettings(user?.uid),
    enabled: !!user?.uid,
    onSuccess: (data) => {
      if (data) {
        setRestaurantName(data.restaurantName || '');
        setLanguage(data.language || '');
      }
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.uid) {
        throw new Error('User must be logged in to save settings');
      }

      const formData = new FormData();
      formData.append('restaurantName', restaurantName);
      formData.append('language', language);
      formData.append('userId', user.uid);
      
      // Append files if they exist
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      return restaurantApi.saveSettings(formData);
    },
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Settings saved successfully!',
        severity: 'success',
      });
      setShowErrors(false); // Reset error display on success
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save settings',
        severity: 'error',
      });
    },
  });

  const handleFileUpload = (type) => (event) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
    event.target.value = '';
  };

  const handleDeleteFile = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
  };

  const handleSave = () => {
    setShowErrors(true); // Show errors when save is clicked
    
    if (!restaurantName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter restaurant name',
        severity: 'error',
      });
      return;
    }

    if (!language) {
      setSnackbar({
        open: true,
        message: 'Please select a language',
        severity: 'error',
      });
      return;
    }

    saveSettingsMutation.mutate();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!user) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Typography color="error">Please log in to manage restaurant settings</Typography>
      </Box>
    );
  }

  if (isLoadingSettings) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
      }}>
        <Typography variant="h6" sx={{ color: '#007AFF' }}>
          Restaurant Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={saveSettingsMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          sx={{
            bgcolor: '#007AFF',
            color: 'white',
            '&:hover': {
              bgcolor: '#0066D6',
            },
            '&:disabled': {
              bgcolor: 'rgba(0, 122, 255, 0.5)',
            },
          }}
        >
          {saveSettingsMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Restaurant Name"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        sx={{ 
          mb: 2,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 122, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#007AFF',
            },
            '&.Mui-error fieldset': {
              borderColor: '#FF3B30',
            },
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            color: 'rgba(255, 255, 255, 0.9)',
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: '#007AFF',
            },
            '&.Mui-error': {
              color: '#FF3B30',
            },
          },
        }}
        error={showErrors && !restaurantName.trim()}
        helperText={showErrors && !restaurantName.trim() ? 'Restaurant name is required' : ''}
      />

      <TextField
        fullWidth
        select
        label="Transliteration Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 122, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#007AFF',
            },
            '&.Mui-error fieldset': {
              borderColor: '#FF3B30',
            },
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            color: 'rgba(255, 255, 255, 0.9)',
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: '#007AFF',
            },
            '&.Mui-error': {
              color: '#FF3B30',
            },
          },
        }}
        error={showErrors && !language}
        helperText={showErrors && !language ? 'Please select a language' : ''}
      >
        {SUPPORTED_LANGUAGES.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                bgcolor: 'rgba(0, 122, 255, 0.1)',
              },
              '&.Mui-selected': {
                bgcolor: 'rgba(0, 122, 255, 0.2)',
                color: '#007AFF',
                '&:hover': {
                  bgcolor: 'rgba(0, 122, 255, 0.3)',
                },
              },
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
          Upload Documents (PDF only)
        </Typography>

        {!files.history && (
          <FileUploadButton
            icon={<HistoryIcon />}
            label="Upload Chat History"
            onChange={handleFileUpload('history')}
          />
        )}
        {files.history && (
          <FileItem
            file={files.history}
            onDelete={() => handleDeleteFile('history')}
            icon={<HistoryIcon sx={{ color: '#90caf9' }} />}
          />
        )}

        {!files.faqs && (
          <FileUploadButton
            icon={<QuestionAnswerIcon />}
            label="Upload FAQs"
            onChange={handleFileUpload('faqs')}
          />
        )}
        {files.faqs && (
          <FileItem
            file={files.faqs}
            onDelete={() => handleDeleteFile('faqs')}
            icon={<QuestionAnswerIcon sx={{ color: '#90caf9' }} />}
          />
        )}

        {!files.menu && (
          <FileUploadButton
            icon={<RestaurantMenuIcon />}
            label="Upload Menu"
            onChange={handleFileUpload('menu')}
          />
        )}
        {files.menu && (
          <FileItem
            file={files.menu}
            onDelete={() => handleDeleteFile('menu')}
            icon={<RestaurantMenuIcon sx={{ color: '#90caf9' }} />}
          />
        )}

        {!files.reviews && (
          <FileUploadButton
            icon={<ReviewsIcon />}
            label="Upload Reviews"
            onChange={handleFileUpload('reviews')}
          />
        )}
        {files.reviews && (
          <FileItem
            file={files.reviews}
            onDelete={() => handleDeleteFile('reviews')}
            icon={<ReviewsIcon sx={{ color: '#90caf9' }} />}
          />
        )}
      </Paper>

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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RestaurantSettings; 