import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
  Avatar,
  Fade,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add this new component for the typing animation
const TypingAnimation = () => (
  <Box sx={{ display: 'flex', gap: 1, px: 1 }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: '#7B61FF',
          opacity: 0.7,
          animation: 'bounce 1.4s infinite',
          animationDelay: `${i * 0.16}s`,
          '@keyframes bounce': {
            '0%, 80%, 100%': {
              transform: 'translateY(0)',
            },
            '40%': {
              transform: 'translateY(-8px)',
            },
          },
        }}
      />
    ))}
  </Box>
);

function MessageContent({ text, isBot, isLoading, isLast }) {
  const [message, setMessage] = useState('')
  const [fadeIn, setFadeIn] = useState(false)
  
  useEffect(() => {
    setFadeIn(true)
    if(isLast){
      delayMessage(text)
    }else{
      setMessage(text)
    }
  },[text])

  const delayMessage = async (text) => {
    const batchSize = 3;
    for(let i = 0; i < text.length; i+=batchSize){
      const batch = text.slice(0,i+batchSize);
      setMessage(batch)
      await delay(100)
    }
  }

  return (
    <Fade in={fadeIn} timeout={400}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: !isBot ? 'flex-end' : 'flex-start',
          // mb: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            maxWidth: '80%',
            bgcolor: '#242642',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'scale(1.01)',
              bgcolor: '#2D2F52',
            }
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              flexDirection: !isBot ? 'row-reverse' : 'row',
            }}
          >
            <Avatar
              sx={{
                bgcolor: isBot ? 'rgba(123, 97, 255, 0.1)' : 'rgba(76, 217, 100, 0.1)',
                width: 40,
                height: 40,
                border: '1px solid',
                borderColor: isBot ? 'rgba(123, 97, 255, 0.2)' : 'rgba(76, 217, 100, 0.2)',
              }}
            >
              {isBot ? (
                <SmartToyIcon sx={{ color: '#7B61FF' }} />
              ) : (
                <PersonIcon sx={{ color: '#4CD964' }} />
              )}
            </Avatar>
            {
              isLoading ? (
                <TypingAnimation />
              ) : (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    flex: 1,
                    color: '#FFFFFF',
                    textAlign: !isBot ? 'right' : 'left',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    letterSpacing: '0.01em'
                  }}
                >
                  {message}
                </Typography>
              )
            }
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
}

const ChatWindow = () => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(message);
      const botMessage = {
        id: Date.now() + 1,
        text: response.reply,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Implement voice recording logic here
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Implement stop recording logic here
  };

  if (!user) {
    navigate('/login');
    return null;
  }
  console.log(messages)
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#1A1B2E',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          overflow: 'hidden',
          bgcolor: 'transparent',
          width:{
            xs: '100%',
            md: 900,
          },
         margin:{
          xs: '0',
          md: '20px',
         },
         borderRadius: {
          xs: '0',
          md: '20px',
         },
          alignSelf: 'center',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(123, 97, 255, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(123, 97, 255, 0.3)',
              },
            },
          }}
        >
          {messages.map((message, index) => (
            <MessageContent
              key={message.id}
              text={message.text}
              isBot={message.sender === 'bot'}
              isLast={message.sender === 'bot' && messages.length-1 === index}
            />
          ))}
          {isLoading && (
            <MessageContent
              text={"Thinking..."}
              isLoading={true}
              isBot={true}
            />
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box
          sx={{
            p: 3,
            bgcolor: '#242642',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#2D2F52',
                borderRadius: 3,
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
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    edge="end"
                    sx={{
                      color: '#7B61FF',
                      '&:hover': {
                        bgcolor: 'rgba(123, 97, 255, 0.1)',
                      },
                    }}
                  >
                    {isRecording ? <StopIcon /> : <MicIcon />}
                  </IconButton>
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading}
                    edge="end"
                    sx={{
                      color: '#7B61FF',
                      '&:hover': {
                        bgcolor: 'rgba(123, 97, 255, 0.1)',
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(123, 97, 255, 0.3)',
                      },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatWindow; 