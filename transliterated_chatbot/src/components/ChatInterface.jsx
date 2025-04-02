import React from 'react';
import { Box } from '@mui/material';
import ChatWindow from './ChatWindow';
import AppBar from './AppBar';
export default function ChatInterface() {
  return (
    <>
    <AppBar />
    <Box
      sx={{
        height: 'calc(100vh - 64px)', // Subtract AppBar height
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      
      <ChatWindow />
    </Box>
    </>
  );
} 