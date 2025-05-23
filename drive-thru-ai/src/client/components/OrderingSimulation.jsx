import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography, IconButton,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Divider, Tooltip,
  Chip
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import axios from 'axios';
import { keyframes } from '@mui/system';
import Vapi from '@vapi-ai/web';
import panCake from '../assets/panCake.png';
import { motion, AnimatePresence } from 'framer-motion';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Fuse from 'fuse.js';
import { useNavigate } from 'react-router-dom';

const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

const messageVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};

const OrderingSimulation = () => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([{
    type: 'assistant',
    text: 'Hello! Welcome to Burger Palace. What can I get for you today?',
    timestamp: new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    })
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
  const [menuItems, setMenuItems] = useState([
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
  const [orderTotal, setOrderTotal] = useState(0);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null)
  const orderItemsRef = useRef(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);
  
  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu-items');
      const filterAvailableItem = response.data.filter(item => item.available == '1')
      setMenuItems(filterAvailableItem);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    if(isSubmitted){
      window.alert('Order placed successfully!')
      submitOrderList()
      // navigate('/orders')
    }
  }, [isSubmitted])

  const submitOrderList = async() => {
    const response = await axios.post('/api/process-order', {items: orderItems});  
    setOrderDetails(response.data)
  }

  const vapiClient = useRef(null);
  const API_KEY = '46f9f5d5-58f2-4114-8f56-447eec6ef9f1';
  useEffect(() => {
    try {
      vapiClient.current = new Vapi(API_KEY || '');

    } catch (error) {
      console.error('Error initializing Vapi client:', error);
    }
  
    return () => {
      if (vapiClient.current?.stop) {
        try {
          vapiClient.current.stop();
        } catch (error) {
          console.error('Error stopping Vapi client:', error);
        }
      }
      vapiClient.current?.removeAllListeners?.();
      window.speechSynthesis.cancel();
    };
  }, []);

  const startListening = async () => {
    if (isListening) return;
    const filterItems = menuItems.map(e => e.name)
    try {
      setIsListening(true);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          text: "Initializing voice assistant, please wait...",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
        },
      ]);
      const assistantId = '8a6c6580-b2c2-462e-859d-af0f51152d8c';
      await vapiClient.current.start(assistantId, {variableValues: {menu: JSON.stringify(filterItems)}});

      vapiClient.current.on("message", (message) => {
        console.log("message => conversation-update ::", message);
        if (message?.role == "user" && message.transcriptType == 'final') {
          handleUserMessage(message.transcript, 'voice');
        }

        if(message?.role == "assistant" && message.transcriptType == 'final') {
          setMessages(prev => [...prev, {
            type: 'assistant',
            text: message.transcript,
            timestamp: new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit', 
              hour12: false 
            })
          }]);          
        }
        if(orderItems.length > 0) {
          setMessages(prev => [...prev, {
            type: 'assistant',
            text: `Say 'That's it' to finish and submit your order.`,
            timestamp: new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit', 
              hour12: false 
            })
          }]);          
        }
      });
      vapiClient.current.on("error", (e) => {
        console.error("error",e);
      });

    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      // Show error to user
      handleUserMessage("Sorry, there was an error starting voice recognition. Please try again or use text input instead.", 'voice');
    }
  };
  

  const stopListening = () => {
    if (vapiClient.current && vapiClient.current.activeAssistant) {
      try {
        console.log('Stopping active assistant...');
        vapiClient.current.activeAssistant.stop();
        vapiClient.current.activeAssistant = null; // Reset activeAssistant
        console.log('Assistant stopped successfully.');
      } catch (error) {
        console.error('Error stopping assistant:', error);
      }
    } else {
      console.warn('No active assistant to stop.');
    }
    setIsListening(false);
  };

  const speakText = async (text) => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onend = resolve;
      window.speechSynthesis.speak(utterance);
    });
  };

  const processOrderText = (text) => {
    const items = [];
    console.log(text, 'Full text received');
  
    menuItems.forEach((menuItem) => {
      // Check if the menu item's name is present in the text
      const regex = new RegExp(`(\\d+)?\\s*${menuItem.name.toLowerCase()}`, 'i'); // Match quantity and item name
      const match = text.toLowerCase().match(regex);
      console.log(match, 'Match for menu item');
      if (match) {
        const quantity = match[1] ? parseInt(match[1], 10) : 1; // Default quantity is 1 if not specified
        items.push({
          ...menuItem,
          quantity,
        });
      }
    });
  
    console.log(items, 'Matched items with quantities');
    return items;
  };

  const addItemsToOrder = (items) => {
    setOrderItems((prevOrderItems) => {
      const updatedOrderItems = [...prevOrderItems];
  
      items.forEach((newItem) => {
        // Check if the item already exists in the order
        const existingItemIndex = updatedOrderItems.findIndex(
          (item) => item.id === newItem.id
        );
  
        if (existingItemIndex !== -1) {
          // If the item exists, update its quantity and total price
          const existingItem = updatedOrderItems[existingItemIndex];
          const customizationTotal =
            newItem.customization?.reduce((sum, option) => sum + parseFloat(option.price), 0) || 0;
  
          updatedOrderItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + newItem.quantity, // Add the new quantity to the existing quantity
            totalPrice:
              (existingItem.price + customizationTotal) *
              (existingItem.quantity + newItem.quantity), // Update the total price
          };
        } else {
          // If the item does not exist, calculate its total price and add it
          const customizationTotal =
            newItem.customization?.reduce((sum, option) => sum + parseFloat(option.price), 0) || 0;
          const totalPrice = (newItem.price + customizationTotal) * newItem.quantity;
  
          updatedOrderItems.push({
            ...newItem,
            totalPrice,
          });
        }
      });
  
      console.log(updatedOrderItems, 'Updated order items');
      return updatedOrderItems;
    });
  
    // Update the total price
    setOrderTotal((prevTotal) =>
      items.reduce((sum, item) => {
        const customizationTotal =
          item.customization?.reduce((sum, option) => sum + parseFloat(option.price), 0) || 0;
        const totalPrice = (item.price + customizationTotal) * item.quantity;
        return sum + totalPrice;
      }, prevTotal)
    );
  
    console.log('Order items updated with customizations');
  };

  const findMatchedItems = (text) => {
  console.log(text, 'Full text received');

  // Configure Fuse.js for fuzzy matching
  const fuse = new Fuse(menuItems, {
    keys: ['name'], // Search by the 'name' field in menuItems
    threshold: 0.4, // Adjust the threshold for matching accuracy (lower is stricter)
  });

  // Perform fuzzy search
  const results = fuse.search(text);
  if(results.length > 0){
    return results[0].item.name;
  }
  return text;
  }
  const removeMenuItems = async (text) => {
    const regex = /remove\s+(\d+)?\s*(.+)/i; // Match "remove [quantity] [item name]"
    const match = text.match(regex);
    console.log(match, 'Regex match');
  
    if (match) {
      const quantityToRemove = match[1] ? parseInt(match[1], 10) : 1; // Default quantity is 1
      let itemName = match[2].toLowerCase().trim();
  
      // Remove trailing punctuation (e.g., ".")
      itemName = itemName.replace(/[^\w\s]/g, '');
      console.log(itemName, 'Cleaned item name');
  
      // Use a functional update to access the latest state
      setOrderItems((prevOrderItems) => {
        const fuse = new Fuse(prevOrderItems, {
          keys: ['name'], // Search by the 'name' field in orderItems
          threshold: 0.6, // Adjust the threshold for matching accuracy (lower is stricter)
        });
  
        const results = fuse.search(itemName);
        console.log(results, 'Fuzzy search results');
        const itemToRemove = results.length > 0 ? results[0].item : null;
        
        if (itemToRemove) {
          console.log(itemToRemove, 'Item to remove');

          // Remove the item or reduce its quantity
          const updatedOrderItems = prevOrderItems.map((item) => {
            if (item.id === itemToRemove.id) {
              const newQuantity = item.quantity - quantityToRemove;
              if (newQuantity > 0) {
                return { ...item, quantity: newQuantity };
              }
              return null; // Mark for removal
            }
            return item;
          }).filter(Boolean); // Remove null items

          console.log(updatedOrderItems, 'Updated order items');

          // Update the total price
          setOrderTotal((prevTotal) =>
            updatedOrderItems.reduce((sum, item) => {
              const customizationTotal =
                item.customization?.reduce((sum, option) => sum + parseFloat(option.price), 0) || 0;
              const totalPrice = (item.price + customizationTotal) * item.quantity;
              return sum + totalPrice;
            }, 0)
          );

          return updatedOrderItems;
        } else {
          console.log('No matching items found');
          setMessages((prev) => [
            ...prev,
            {
              type: 'assistant',
              text: `I couldn't find ${itemName} in your order.`,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              }),
            },
          ]);
          return prevOrderItems; // Return the previous state if no match is found
        }
      });
  
    } else {
      // Invalid command format
      setMessages((prev) => [
        ...prev,
        {
          type: 'assistant',
          text: "I couldn't understand your command. Please try again.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
        },
      ]);
    }
  };

  const handleUserMessage = async (text, from = 'voice') => {
    console.log(text, 'User message received');
    setIsProcessingOrder(true);
  
    const newMessage = {
      type: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
  
    try {
      if (text.toLowerCase().startsWith('remove')) {
        removeMenuItems(text);
      } else {
        const finalText = findMatchedItems(text)
        // Handle adding items to the order
        const identifiedItems = processOrderText(finalText);
        console.log(identifiedItems, 'Identified items');
        if (identifiedItems.length > 0) {
          addItemsToOrder(identifiedItems);
  
          const itemsList = identifiedItems
            .map((item) => `${item.quantity || 1} ${item.name}`)
            .join(', ');
  
          const confirmationMessage = `I've added ${itemsList} to your order. Would you like anything else?`;
  
          setMessages((prev) => [
            ...prev,
            {
              type: 'assistant',
              text: confirmationMessage,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              }),
            },
          ]);
        } 
        // else {
        //   const noItemsMessage =
        //     "I couldn't identify any menu items in your order. Could you please try again?";
        //   setMessages((prev) => [
        //     ...prev,
        //     {
        //       type: 'assistant',
        //       text: noItemsMessage,
        //       timestamp: new Date().toLocaleTimeString([], {
        //         hour: '2-digit',
        //         minute: '2-digit',
        //         second: '2-digit',
        //         hour12: false,
        //       }),
        //     },
        //   ]);
        // }
        if(text == `That's it.`){
          console.log('Sumbmiting_your_order!')
          setIsSubmitted(true)
        }
      }
    } catch (error) {
      console.error('Error processing order:', error);
      const errorMessage =
        'Sorry, there was an error processing your order. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          type: 'assistant',
          text: errorMessage,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
        },
      ]);
    }
    setIsProcessingOrder(false);
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      handleUserMessage(inputText, 'inputType');
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

  useEffect(() => {
    if (messagesContainerRef.current) {
      const scrollContainer = messagesContainerRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Update useEffect for auto-scrolling
  useEffect(() => {
    if (orderItemsRef.current) {
      const scrollToBottom = () => {
        orderItemsRef.current.scrollTo({
          top: orderItemsRef.current.scrollHeight,
          behavior: 'smooth'
        });
      };
      scrollToBottom();
    }
  }, [orderItems, orderDetails]); // Add orderDetails to dependency array

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}>
            <motion.div
              // animate={{ rotate: 360 }}
              // transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              {/* <DriveEtaIcon sx={{ color: '#ff5722', fontSize: 40 }} /> */}
              </motion.div>
            Order Simulation
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Simulate placing an order with the AI voice agent
          </Typography>
          {/* <button onClick={() => speakText("Welcome to Burger Palace!")}>
            🔊 Speak
          </button> */}
        </Box>
      </motion.div>

      <Box 
        ref={containerRef}
        sx={{ 
          display: 'flex', 
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative',
          userSelect: isDragging ? 'none' : 'auto',
          margin: 1,
          border: '1px solid #EEE',
          borderRadius: 5
        }}
      >
        {/* AI Assistant Column */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ width: `${leftWidth}%`, height: '100%' }}
        >
          <Box 
            ref={leftColumnRef}
            sx={{ 
              borderRight: '1px solid',
              borderColor: 'divider',
              position: 'relative', 
              // border: '1px solid #C3C3C3', 
              // borderRadius: 5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ 
              p: 2, 
              textAlign: 'center', 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              position: 'sticky',
              top: 0,
              zIndex: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Drive-Thru AI Assistant
              </Typography>
            </Box>

            <Box sx={{ 
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              height: 0,
              '&::-webkit-scrollbar': {
                width: '0px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.15)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.25)',
                },
              },
            }}
            ref={messagesContainerRef}
            >
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: 20 }}
                  >
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
                        {/* {message.type === 'assistant' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <VolumeUpIcon sx={{ mr: 1, color: '#ff5722' }} />
                          </Box>
                        )} */}
                        <Typography variant="body1">{message.text}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {message.timestamp}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>

            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              position: 'sticky',
              bottom: 0,
              zIndex: 2,
              mt: 'auto'
            }}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  backgroundColor: 'background.paper'
                }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type your order here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 2,
                        backgroundColor: 'background.paper'
                      }
                    }}
                  />
                  <Tooltip title={isListening ? "Stop Recording" : "Start Recording"}>
                    <IconButton
                      color="primary"
                      onClick={isListening ? stopListening : startListening}
                      sx={{
                        animation: isListening ? `${pulseAnimation} 1.5s infinite` : 'none',
                        bgcolor: isListening ? 'rgba(255, 87, 34, 0.1)' : 'transparent',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <motion.div
                        animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <MicIcon />
                      </motion.div>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Send Message">
                    <IconButton 
                      color="primary" 
                      onClick={handleSendMessage}
                      component={motion.button}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </motion.div>
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
        </motion.div>

        {/* Selected Items Column */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ width: `${middleWidth}%`, height: '100%' }}
        >
          <Box 
            ref={middleColumnRef}
            sx={{ 
              borderRight: '1px solid',
              borderColor: 'divider',
              position: 'relative', 
              // border: '1px solid #C3C3C3', 
              // borderRadius: 5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                position: 'sticky',
                top: 0,
                zIndex: 2
              }}>
                <ShoppingCartIcon sx={{ color: '#ff5722' }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>Selected Items</Typography>
                <Typography variant="body2" sx={{ ml: 'auto', color: 'text.secondary' }}>
                  {orderItems?.length} items
                </Typography>
              </Box>

              {orderItems?.length === 0 ? (
                <Box sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  color: 'text.secondary'
                }}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ShoppingCartIcon sx={{ fontSize: 48, mb: 2, color: '#ff5722' }} />
                    <Typography>No items in order yet</Typography>
                    <Typography variant="body2">Items will appear here as you order</Typography>
                  </motion.div>
                </Box>
              ) : (
                <Box sx={{ 
                  flexGrow: 1,
                  overflow: 'auto',
                  height: 0,
                  '&::-webkit-scrollbar': {
                    width: '0px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.25)',
                    },
                  },
                }}
                ref={orderItemsRef}
                >
                  <AnimatePresence>
                    {orderItems?.map((item, index) => (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Box sx={{ 
                          p: 2, 
                          borderBottom: '1px solid', 
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.02)'
                          }
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <FastfoodIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                              {item.name}
                              <Chip 
                                label={`x${item.quantity || 1}`}
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                              />
                            </Typography>
                            <Typography variant="subtitle1" color="primary">
                              ${(item.price * (item.quantity || 1)).toFixed(2)}
                            </Typography>
                          </Box>
                          {item.customization && item.customization.map((option, optIndex) => (
                            <motion.div
                              key={optIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: optIndex * 0.1 }}
                            >
                              <Typography
                                variant="body2"
                                color="warning.main"
                                sx={{ 
                                  ml: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                <AddCircleIcon sx={{ fontSize: 14 }} />
                                {option.name} (+${parseFloat(option.price).toFixed(2)})
                              </Typography>
                            </motion.div>
                          ))}
                        </Box>
                      </motion.div>
                    ))}
                    {
                      orderDetails &&
                      <motion.div
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Box sx={{ 
                          p: 2, 
                          mt:3,
                          borderBottom: '1px solid', 
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.02)'
                          }
                        }}>
                          <Typography variant="h6" color="primary">Order successfully placed</Typography>
                          <Typography variant="body2" color="text.secondary">Your order number</Typography>
                          <Typography variant="h4" color="text.secondary">#{orderDetails?.orderId}</Typography>
                        </Box>
                      </motion.div>
                    }
                  </AnimatePresence>
                </Box>
              )}

              {orderItems?.length > 0 && (
                <Box sx={{ 
                  p: 2, 
                  borderTop: '1px solid', 
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 2
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <Typography variant="subtitle1">Subtotal:</Typography>
                    <Typography variant="h6" color="primary">
                      ${orderTotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <Typography variant="subtitle1">Tax (8%):</Typography>
                    <Typography variant="h6" color="primary">
                      ${(orderTotal * 0.08).toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
                      ${(orderTotal * 1.08).toFixed(2)}
                    </Typography>
                  </Box>
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
        </motion.div>

        {/* Menu Column */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ flex: 1 }}
        >
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
              <AnimatePresence>
                {menuItems.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    layout
                  >
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
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardMedia
                          component="img"
                          height="160"
                          image={item.image}
                          alt={'Burger image'}
                          sx={{ objectFit: 'cover' }}
                        />
                      </motion.div>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <FastfoodIcon sx={{ color: 'primary.main' }} />
                            {item.name}
                          </Typography>
                          <motion.div whileHover={{ scale: 1.1 }}>
                            <Typography variant="h6" color="primary">
                              ${item.price.toFixed(2)}
                            </Typography>
                          </motion.div>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {item.description}
                        </Typography>
                        {item?.customization?.length > 0 &&
                        <>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1,
                            mb: 1
                          }}>
                            <AddCircleIcon sx={{ fontSize: 18 }} />
                            Customizations:
                          </Typography>
                          {item?.customization?.map((option, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ ml: 1, mb: 0.5 }}
                              >
                                • {option.name} (+${parseFloat(option.price).toFixed(2)})
                              </Typography>
                            </motion.div>
                          ))}
                        </Box>
                        </>
                        }
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default OrderingSimulation; 