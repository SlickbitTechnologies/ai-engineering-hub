import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Fade,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import axios from 'axios';
import { keyframes } from '@mui/system';
import Vapi from '@vapi-ai/web';
import panCake from '../assets/panCake.png';

const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const OrderingSimulation = () => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([{
    type: 'assistant',
    text: 'Hello! Welcome to Burger Palace. What can I get for you today?',
    timestamp: '16:53:48'
  }]);
  const [orderItems, setOrderItems] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [leftWidth, setLeftWidth] = useState(33);
  const [middleWidth, setMiddleWidth] = useState(33);
  const containerRef = useRef(null);
  const leftColumnRef = useRef(null);
  const middleColumnRef = useRef(null);
  const [activeResizer, setActiveResizer] = useState(null);
  const [menuItems] = useState([
    {
      id: 1,
      name: 'Classic Burger',
      price: 5.99,
      image: panCake,
      description: 'Beef patty with lettuce, tomato, onion, and special sauce',
      options: [
        { name: 'Extra Patty', price: 2.50 },
        { name: 'Cheese', price: 0.50 },
        { name: 'Bacon', price: 1.50 }
      ]
    },
    {
      id: 2,
      name: 'Cheese Burger',
      price: 6.99,
      image: panCake,
      description: 'Beef patty with American cheese, lettuce, tomato',
      options: [
        { name: 'Extra Patty', price: 2.50 },
        { name: 'Bacon', price: 1.50 }
      ]
    },
    {
      id: 3,
      name: 'French Fries',
      price: 2.99,
      image: panCake,
      description: 'Crispy golden fries with salt',
      options: [
        { name: 'Large', price: 1.00 },
        { name: 'Cheese Sauce', price: 1.00 }
      ]
    }
  ]);

  const vapiClient = useRef(null);
  useEffect(() => {
    vapiClient.current = new Vapi({
      apiKey: '996cca89-2691-45e4-ab58-cd7d6290477e',
    });
  
    return () => {
      if (vapiClient.current?.stop) {
        vapiClient.current.stop(); // Stop active session if running
      }
  
      // Optional: clean up event listeners
      vapiClient.current?.removeAllListeners?.();
    };
  }, []);
  
  
  

  const startListening = async () => {
    if (isListening) return;
  
    try {
      setIsListening(true);
  
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      const assistant = await vapiClient.current.start({
        audioStream: stream,
        assistant: {
          name: "Drive-thru Assistant",
          model: "gpt-3.5-turbo",
          prompt: "You are a friendly drive-thru AI assistant at Burger Palace. Help customers place their orders."
        },
        onTranscript: (transcript) => {
          if (transcript && transcript.text) {
            handleUserMessage(transcript.text);
          }
        },
        onError: (error) => {
          console.error('Vapi error:', error);
          setIsListening(false);
        },
        onStop: () => {
          setIsListening(false);
          stream.getTracks().forEach(track => track.stop());
        }
      });
  
      vapiClient.current.activeAssistant = assistant;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
    }
  };
  
  

  const stopListening = () => {
    if (vapiClient.current && vapiClient.current.activeAssistant) {
      vapiClient.current.activeAssistant.stop();
      vapiClient.current.activeAssistant = null;
    }
    setIsListening(false);
  };

  const handleUserMessage = async (text) => {
    const newMessage = {
      type: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    };
    setMessages(prev => [...prev, newMessage]);
    
    try {
      const response = await axios.post('/api/process-order', { text });
      if (response.data.items && response.data.items.length > 0) {
        setOrderItems(prev => [...prev, ...response.data.items]);
        setMessages(prev => [...prev, {
          type: 'assistant',
          text: `I've added ${response.data.items.map(item => item.name).join(', ')} to your order. Would you like anything else?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'assistant',
          text: "I couldn't find any menu items in your order. Could you please try again?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        }]);
      }
    } catch (error) {
      console.error('Error processing order:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        text: "Sorry, there was an error processing your order. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      }]);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      handleUserMessage(inputText);
      setInputText('');
    }
  };

  const startDragging = (e, resizer) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setActiveResizer(resizer);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDragging);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaX = e.clientX - startX;
    const deltaPercentage = (deltaX / containerWidth) * 100;

    if (activeResizer === 'left') {
      const newLeftWidth = Math.min(Math.max(20, leftWidth + deltaPercentage), 60);
      const newMiddleWidth = Math.min(Math.max(20, middleWidth - deltaPercentage), 60);
      setLeftWidth(newLeftWidth);
      setMiddleWidth(newMiddleWidth);
    } else if (activeResizer === 'middle') {
      const newMiddleWidth = Math.min(Math.max(20, middleWidth + deltaPercentage), 60);
      setMiddleWidth(newMiddleWidth);
    }

    setStartX(e.clientX);
  };

  const stopDragging = () => {
    setIsDragging(false);
    setActiveResizer(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopDragging);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Order Simulation
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Simulate placing an order with the AI voice agent
        </Typography>
      </Box>

      <Box 
        ref={containerRef}
        sx={{ 
          display: 'flex', 
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative',
          userSelect: isDragging ? 'none' : 'auto',
          padding: 2
        }}
      >
        {/* AI Assistant Column */}
        <Box 
          ref={leftColumnRef}
          sx={{ 
            width: `${leftWidth}%`,
            borderRight: '1px solid',
            borderColor: 'divider',
            position: 'relative', 
            border: '1px solid #C3C3C3', 
            borderRadius: 5
          }}
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Drive-Thru AI Assistant
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {messages.map((message, index) => (
                <Fade in={true} key={index}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}>
                    <Box sx={{
                      p: 2,
                      bgcolor: message.type === 'user' ? '#e3f2fd' : '#f5f5f5',
                      borderRadius: 2,
                      maxWidth: '80%'
                    }}>
                      {message.type === 'assistant' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <VolumeUpIcon sx={{ mr: 1, color: '#ff5722' }} />
                        </Box>
                      )}
                      <Typography variant="body1">{message.text}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {message.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              ))}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type your order here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <IconButton
                  color="primary"
                  onClick={isListening ? stopListening : startListening}
                  sx={{
                    animation: isListening ? `${pulseAnimation} 1.5s infinite` : 'none',
                    bgcolor: isListening ? 'rgba(255, 87, 34, 0.1)' : 'transparent'
                  }}
                >
                  <MicIcon />
                </IconButton>
                <IconButton color="primary" onClick={handleSendMessage}>
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              right: -6,
              top: 0,
              bottom: 0,
              width: 12,
              cursor: 'col-resize',
              zIndex: 2,
              '&:hover': {
                '&::after': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: isDragging && activeResizer === 'left' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                transition: 'background-color 0.2s'
              }
            }}
            onMouseDown={(e) => startDragging(e, 'left')}
          />
        </Box>

        {/* Selected Items Column */}
        <Box 
          ref={middleColumnRef}
          sx={{ 
            width: `${middleWidth}%`,
            borderRight: '1px solid',
            borderColor: 'divider',
            position: 'relative', 
            border: '1px solid #C3C3C3', 
            borderRadius: 5
          }}
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <ShoppingCartIcon sx={{ color: '#ff5722' }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>Selected Items</Typography>
              <Typography variant="body2" sx={{ ml: 'auto', color: 'text.secondary' }}>
                {orderItems.length} items
              </Typography>
            </Box>

            {orderItems.length === 0 ? (
              <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                color: 'text.secondary'
              }}>
                <ShoppingCartIcon sx={{ fontSize: 48, mb: 2, color: '#ff5722' }} />
                <Typography>No items in order yet</Typography>
                <Typography variant="body2">Items will appear here as you order</Typography>
              </Box>
            ) : (
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {orderItems.map((item, index) => (
                  <Fade in={true} key={index}>
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">{item.name}</Typography>
                        <Typography variant="subtitle1">${item.price.toFixed(2)}</Typography>
                      </Box>
                      {item.options && item.options.map((option, optIndex) => (
                        <Typography
                          key={optIndex}
                          variant="body2"
                          color="warning.main"
                          sx={{ ml: 2 }}
                        >
                          • {option.name} (+${option.price.toFixed(2)})
                        </Typography>
                      ))}
                    </Box>
                  </Fade>
                ))}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              position: 'absolute',
              right: -6,
              top: 0,
              bottom: 0,
              width: 12,
              cursor: 'col-resize',
              zIndex: 2,
              '&:hover': {
                '&::after': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: isDragging && activeResizer === 'middle' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                transition: 'background-color 0.2s'
              }
            }}
            onMouseDown={(e) => startDragging(e, 'middle')}
          />
        </Box>

        {/* Menu Column */}
        <Box sx={{ flex: 1, border: '1px solid #C3C3C3', borderRadius: 5 }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              // bgcolor: '#fff',
              zIndex: 1
            }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>Menu</Typography>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {menuItems.map((item) => (
                <Fade in={true} key={item.id}>
                  <Card
                    elevation={0}
                    sx={{
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="160"
                      image={item.image}
                      alt={item.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          ${item.price.toFixed(2)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {item.description}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Options:</Typography>
                      {item.options.map((option, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1, mb: 0.5 }}
                        >
                          • {option.name} (+${option.price.toFixed(2)})
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Fade>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderingSimulation; 