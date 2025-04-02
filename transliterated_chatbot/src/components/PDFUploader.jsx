import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  LinearProgress,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function PDFUploader({ onPDFUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      onPDFUploaded(data.filename);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload PDF file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Upload PDF Document
      </Typography>
      
      <input
        accept="application/pdf"
        style={{ display: 'none' }}
        id="pdf-upload"
        type="file"
        onChange={handleFileChange}
      />
      
      <label htmlFor="pdf-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={uploading}
        >
          Select PDF
        </Button>
      </label>

      {file && (
        <Typography sx={{ mt: 2 }}>
          Selected file: {file.name}
        </Typography>
      )}

      {file && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={uploading}
          sx={{ mt: 2 }}
        >
          Upload
        </Button>
      )}

      {uploading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

export default PDFUploader; 