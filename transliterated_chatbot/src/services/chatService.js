import { chatApi } from './apiService';

export const sendMessage = async (message) => {
  try {
    return await chatApi.sendMessage(message);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}; 