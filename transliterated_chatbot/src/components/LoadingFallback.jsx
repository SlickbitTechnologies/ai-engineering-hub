import React from 'react';
import { Box, CircularProgress } from '@mui/material';

function LoadingFallback() {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000
      }}
    >
      <CircularProgress sx={{ color: '#90caf9' }} />
    </Box>
  );
}

export default LoadingFallback; 