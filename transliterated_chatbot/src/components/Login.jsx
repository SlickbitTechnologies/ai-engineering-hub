import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';
import { useSpring, animated } from '@react-spring/web';
import { 
  signInWithEmail, 
  signInWithGoogle, 
  signUpWithEmail 
} from '../services/firebaseAuth';

const AnimatedPaper = animated(Paper);

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const flipAnimation = useSpring({
    transform: isSignUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
    config: { tension: 300, friction: 20 },
  });

  const backFlipAnimation = useSpring({
    transform: isSignUp ? 'rotateY(0deg)' : 'rotateY(180deg)',
    config: { tension: 300, friction: 20 },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(formData.email, formData.password, formData.username);
      } else {
        await signInWithEmail(formData.email, formData.password);
      }
      navigate('/chat');
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      navigate('/chat');
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  const renderLoginForm = () => (
    <AnimatedPaper
      elevation={0}
      style={flipAnimation}
      sx={{
        p: 4,
        width: '100%',
        maxWidth: 400,
        bgcolor: '#242642',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        backfaceVisibility: 'hidden',
        position: 'absolute',
        transformStyle: 'preserve-3d',
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          textAlign: 'center',
          mb: 4,
          color: '#7B61FF',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        Welcome Back
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            bgcolor: 'rgba(255, 107, 138, 0.1)',
            color: '#FF6B8A',
            '& .MuiAlert-icon': {
              color: '#FF6B8A',
            },
          }}
        >
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: '#7B61FF' }} />
              </InputAdornment>
            ),
          }}
          sx={textFieldStyle}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: '#7B61FF' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{
                    color: '#7B61FF',
                    '&:hover': {
                      bgcolor: 'rgba(123, 97, 255, 0.1)',
                    },
                  }}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={textFieldStyle}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            mt: 3,
            py: 1.5,
            bgcolor: '#7B61FF',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': {
              bgcolor: '#6344FF',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(123, 97, 255, 0.3)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Sign In'}
        </Button>
      </form>

      <Divider 
        sx={{ 
          my: 3,
          '&::before, &::after': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        OR
      </Divider>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleSignIn}
        disabled={loading}
        sx={{
          py: 1.5,
          color: '#7B61FF',
          borderColor: 'rgba(123, 97, 255, 0.3)',
          '&:hover': {
            borderColor: '#7B61FF',
            bgcolor: 'rgba(123, 97, 255, 0.1)',
          },
          '&.Mui-disabled': {
            borderColor: 'rgba(123, 97, 255, 0.1)',
            color: 'rgba(123, 97, 255, 0.3)',
          },
        }}
      >
        Continue with Google
      </Button>

      <Button
        fullWidth
        variant="text"
        onClick={toggleSignUp}
        sx={{
          mt: 2,
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': {
            color: '#7B61FF',
            bgcolor: 'rgba(123, 97, 255, 0.1)',
          },
        }}
      >
        Don't have an account? Sign Up
      </Button>
    </AnimatedPaper>
  );

  const renderSignupForm = () => (
    <AnimatedPaper
      elevation={0}
      style={backFlipAnimation}
      sx={{
        p: 4,
        width: '100%',
        maxWidth: 400,
        bgcolor: '#242642',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        backfaceVisibility: 'hidden',
        position: 'absolute',
        transformStyle: 'preserve-3d',
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          textAlign: 'center',
          mb: 4,
          color: '#7B61FF',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        Create Account
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            bgcolor: 'rgba(255, 107, 138, 0.1)',
            color: '#FF6B8A',
            '& .MuiAlert-icon': {
              color: '#FF6B8A',
            },
          }}
        >
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: '#7B61FF' }} />
              </InputAdornment>
            ),
          }}
          sx={textFieldStyle}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: '#7B61FF' }} />
              </InputAdornment>
            ),
          }}
          sx={textFieldStyle}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: '#7B61FF' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{
                    color: '#7B61FF',
                    '&:hover': {
                      bgcolor: 'rgba(123, 97, 255, 0.1)',
                    },
                  }}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={textFieldStyle}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            mt: 3,
            py: 1.5,
            bgcolor: '#7B61FF',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': {
              bgcolor: '#6344FF',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(123, 97, 255, 0.3)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Create Account'}
        </Button>
      </form>

      <Divider 
        sx={{ 
          my: 3,
          '&::before, &::after': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        OR
      </Divider>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleSignIn}
        disabled={loading}
        sx={{
          py: 1.5,
          color: '#7B61FF',
          borderColor: 'rgba(123, 97, 255, 0.3)',
          '&:hover': {
            borderColor: '#7B61FF',
            bgcolor: 'rgba(123, 97, 255, 0.1)',
          },
          '&.Mui-disabled': {
            borderColor: 'rgba(123, 97, 255, 0.1)',
            color: 'rgba(123, 97, 255, 0.3)',
          },
        }}
      >
        Continue with Google
      </Button>

      <Button
        fullWidth
        variant="text"
        onClick={toggleSignUp}
        sx={{
          mt: 2,
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': {
            color: '#7B61FF',
            bgcolor: 'rgba(123, 97, 255, 0.1)',
          },
        }}
      >
        Already have an account? Sign In
      </Button>
    </AnimatedPaper>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#1A1B2E',
        perspective: '1000px',
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          height: 'auto',
          transformStyle: 'preserve-3d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {renderLoginForm()}
        {renderSignupForm()}
      </Box>
    </Box>
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
  '& .MuiInputBase-input::placeholder': {
    color: 'rgba(255, 255, 255, 0.5)',
  },
};

export default Login; 