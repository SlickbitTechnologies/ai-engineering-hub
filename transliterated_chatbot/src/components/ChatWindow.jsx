import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useSpring, animated, config } from '@react-spring/web';
import { useChat } from '../hooks/useChat';

const AnimatedPaper = animated(Paper);
const AnimatedBox = animated(Box);

function MessageContent({ text, isBot }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }} className='message-content'>
      <Avatar
        sx={{
          bgcolor: isBot ? 'rgba(23, 133, 130, 0.1)' : 'rgba(191, 161, 129, 0.1)',
          width: 40,
          height: 40,
          border: '1px solid',
          borderColor: isBot ? 'rgba(23, 133, 130, 0.2)' : 'rgba(191, 161, 129, 0.2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {isBot ? (
          <SmartToyIcon sx={{ color: '#178582' }} />
        ) : (
          <PersonIcon sx={{ color: '#BFA181' }} />
        )}
      </Avatar>
      <Typography variant="body1" sx={{ flex: 1 }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function ChatWindow() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { sendMessage, isSending, messages } = useChat();

  // Message container animation
  const containerSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: config.gentle
  });

  // Input area animation
  const inputSpring = useSpring({
    from: { transform: 'translateY(50px)', opacity: 0 },
    to: { transform: 'translateY(0px)', opacity: 1 },
    config: config.gentle,
    delay: 200
  });

  // Send button hover animation
  const [buttonProps, buttonApi] = useSpring(() => ({
    scale: 1,
    rotate: 0,
    config: { mass: 1, tension: 300, friction: 10 }
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const message = input.trim();
    setInput('');
    sendMessage(message);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const messageSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.wobbly
  });

  return (
    <Box sx={{ 
      flex: 1, 
      p: 2, 
      height: '100%', 
      overflow: 'hidden',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // background: 'radial-gradient(circle at 50% 50%, rgba(23, 133, 130, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }
    }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <AnimatedPaper 
          elevation={0} 
          // style={containerSpring}
          sx={{ 
            flex: 1, 
            overflow: 'auto', 
            mb: 2, 
            p: 3,
            // bgcolor: 'transparent',
            border: 'none',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.12)',
              },
            },
          }}
        >
          {messages.map((message) => (
            <AnimatedBox
              key={message.id}
              style={messageSpring}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 3,
              }}
            >
              <AnimatedPaper
                elevation={1}
                sx={{
                  p: 2,
                  pl: 3,
                  maxWidth: '80%',
                  minWidth: '300px',
                  bgcolor: message.sender === 'user' 
                    ? 'rgba(23, 133, 130, 0.08)' 
                    : 'rgba(10, 24, 40, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${message.sender === 'user' 
                    ? 'rgba(23, 133, 130, 0.15)' 
                    : 'rgba(10, 24, 40, 0.08)'}`,
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                  borderRadius: 2,
                  transform: message.sender === 'user' ? 'perspective(1000px) rotateY(-5deg)' : 'perspective(1000px) rotateY(-5deg)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(0deg) scale(1.02)',
                    bgcolor: message.sender === 'user'
                      ? 'rgba(23, 133, 130, 0.12)'
                      : 'rgba(10, 24, 40, 0.05)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                  }
                }}
              >
                <MessageContent 
                  text={message.text}
                  isBot={message.sender === 'bot'}
                />
              </AnimatedPaper>
            </AnimatedBox>
          ))}
          <div ref={messagesEndRef} />
        </AnimatedPaper>

        <animated.div style={inputSpring}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type something..."
              disabled={isSending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#178582',
                    bgcolor: 'rgba(23, 133, 130, 0.05)',
                    transform: 'scale(1.01)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                  }
                }
              }}
            />
            <animated.div
              style={buttonProps}
              onMouseEnter={() => buttonApi.start({ scale: 1.1, rotate: 10 })}
              onMouseLeave={() => buttonApi.start({ scale: 1, rotate: 0 })}
            >
              <IconButton 
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                sx={{ 
                  bgcolor: 'rgba(23, 133, 130, 0.03)',
                  border: '1px solid rgba(23, 133, 130, 0.08)',
                  borderRadius: '12px',
                  width: 64,
                  height: 64,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'rgba(23, 133, 130, 0.08)',
                    borderColor: 'rgba(23, 133, 130, 0.15)',
                  },
                  '&:disabled': {
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    opacity: 0.5
                  }
                }}
              >
                {isSending ? (
                  <CircularProgress 
                    size={28} 
                    sx={{ 
                      color: '#178582'
                    }} 
                  />
                ) : (
                  <SendIcon sx={{ fontSize: 28 }} />
                )}
              </IconButton>
            </animated.div>
          </Box>
        </animated.div>
      </Box>
    </Box>
  );
} 