import { SentimentData } from '../types/sentiment';
import { UploadedFile } from '../types/upload';

const API_BASE_URL = 'http://localhost:8000/api';

export const sentimentService = {
  async getSentimentData(): Promise<SentimentData> {
    try {
      const response = await fetch(`${API_BASE_URL}/sentiment`);
      if (!response.ok) {
        throw new Error('Failed to fetch sentiment data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      throw error;
    }
  },

  async analyzeSentiment(text: string): Promise<SentimentData> {
    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }
      return await response.json();
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  },

  async uploadFiles(formData: FormData): Promise<{ files: UploadedFile[] }> {
    try {
      console.log('Uploading files to:', `${API_BASE_URL}/upload`);
      
      // Debug FormData content
      for (const pair of formData.entries()) {
        console.log('FormData contains:', pair[0], pair[1]);
      }
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || 'Failed to upload files');
        } catch (parseError) {
          throw new Error(`Failed to upload files: ${errorText || response.statusText}`);
        }
      }
      
      const result = await response.json();
      console.log('Upload success result:', result);
      return result;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  async getUploads(): Promise<UploadedFile[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads`);
      if (!response.ok) {
        throw new Error('Failed to fetch uploads');
      }
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error fetching uploads:', error);
      throw error;
    }
  },

  async deleteUpload(fileId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/${fileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete file: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  async analyzeUpload(fileId: string): Promise<any> {
    try {
      console.log(`Sending analyze request for file ID: ${fileId}`);
      
      const response = await fetch(`${API_BASE_URL}/uploads/${fileId}/analyze`, {
        method: 'POST',
      });
      
      console.log('Analyze response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analyze error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || 'Failed to analyze file');
        } catch (parseError) {
          throw new Error(`Failed to analyze file: ${errorText || response.statusText}`);
        }
      }
      
      const result = await response.json();
      console.log('Analyze success result:', result);
      return result;
    } catch (error) {
      console.error('Error analyzing file:', error);
      throw error;
    }
  },

  async analyzeAllUploads(): Promise<any> {
    try {
      console.log('Sending analyze-all request');
      
      const response = await fetch(`${API_BASE_URL}/uploads/analyze-all`);
      
      console.log('Analyze-all response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analyze-all error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || 'Failed to analyze all files');
        } catch (parseError) {
          throw new Error(`Failed to analyze all files: ${errorText || response.statusText}`);
        }
      }
      
      const result = await response.json();
      console.log('Analyze-all success result:', result);
      return result;
    } catch (error) {
      console.error('Error analyzing all files:', error);
      throw error;
    }
  },

  async getThemes() {
    try {
      const response = await fetch(`${API_BASE_URL}/themes`);
      if (!response.ok) {
        throw new Error('Failed to fetch themes');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching themes:', error);
      throw error;
    }
  },
}; 