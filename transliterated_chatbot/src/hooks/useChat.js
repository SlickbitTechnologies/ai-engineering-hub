import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { sendMessage } from '../services/chatService';

export const useChat = () => {
  const queryClient = useQueryClient();

  // Query for getting messages from cache
  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    // Initialize with empty array if no messages in cache
    initialData: [],
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      // Add both user message and bot response to cache
      queryClient.setQueryData(['messages'], (oldMessages = []) => {
        
        const botMessage = {
          id: Date.now() + 1,
          text: data.reply,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        return [...oldMessages, botMessage];
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      // Add error message to chat
      queryClient.setQueryData(['messages'], (oldMessages = []) => {
        const errorMessage = {
          id: Date.now(),
          text: 'Sorry, there was an error processing your message. Please try again.',
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        return [...oldMessages, errorMessage];
      });
    }
  });

  const handleSendMessage = (message) => {
    // Immediately add user message to cache
    queryClient.setQueryData(['messages'], (oldMessages = []) => {
      const userMessage = {
        id: Date.now(),
        text: message,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      return [...oldMessages, userMessage];
    });
    // Then send the message to get bot response
    sendMessageMutation.mutate(message);
  };

  return {
    messages,
    sendMessage: handleSendMessage,
    isSending: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
}; 