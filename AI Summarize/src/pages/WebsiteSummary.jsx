import { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Language, ContentCopy, Close } from '@mui/icons-material';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const WebsiteSummary = () => {
  const [url, setUrl] = useState('https://the-flow.ai/');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const saveToHistory = (url, summary) => {
    const history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    const newEntry = {
      id: Date.now(),
      url,
      summary,
      timestamp: new Date().toISOString(),
    };
    history.unshift(newEntry); // Add new entry at the beginning
    localStorage.setItem('summaryHistory', JSON.stringify(history));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await fetch('/api/summarize/website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize website');
      }

      if (!data.summary) {
        throw new Error('No summary received');
      }

      setSummary(data.summary);
      saveToHistory(url, data.summary); // Save to history after successful summary
    } catch (err) {
      setError(err.message);
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMarkdown = (content) => {
    const sanitizedHtml = DOMPurify.sanitize(marked(content));
    return { __html: sanitizedHtml };
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            p: 4,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                display: 'inline-block',
                marginBottom: '1rem'
              }}
            >
              <Language sx={{ fontSize: 48, color: '#2196F3' }} />
            </motion.div>
            <Typography
              variant="h4"
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #00BCD4 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                fontWeight: 'bold',
                mb: 2,
              }}
            >
              Website Summarizer
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Enter any website URL to get an AI-powered summary
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.6)',
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #2196F3 30%, #00BCD4 90%)',
                boxShadow: '0 3px 15px rgba(33, 150, 243, 0.3)',
                fontSize: '1.1rem',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Summarize'
              )}
            </Button>
          </form>

          <Collapse in={!!error}>
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setError('')}
                >
                  <Close fontSize="inherit" />
                </IconButton>
              }
              sx={{ mt: 2, borderRadius: '12px' }}
            >
              {error}
            </Alert>
          </Collapse>

          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper
                elevation={0}
                sx={{
                  mt: 4,
                  p: 4,
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '16px',
                  position: 'relative',
                }}
              >
                <IconButton
                  onClick={handleCopy}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: 16,
                  }}
                >
                  <ContentCopy />
                </IconButton>

                <Box sx={{ 
                  textAlign: 'left',
                  '& h1': { 
                    fontSize: '1.8rem',
                    color: 'primary.main',
                    mb: 2,
                    fontWeight: 'bold',
                    textAlign: 'left',
                  },
                  '& h2': {
                    fontSize: '1.4rem',
                    color: 'primary.dark',
                    mt: 3,
                    mb: 2,
                    fontWeight: 'bold',
                    textAlign: 'left',
                  },
                  '& ul': {
                    listStyle: 'none',
                    pl: 0,
                    mb: 2,
                  },
                  '& li': {
                    mb: 1.5,
                    pl: 0,
                    position: 'relative',
                  },
                  '& p': {
                    lineHeight: 1.8,
                    mb: 2,
                    textAlign: 'left',
                  },
                }}>
                  <div dangerouslySetInnerHTML={renderMarkdown(summary)} />
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 3,
                    color: 'text.secondary',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    pt: 2,
                  }}
                >
                  Summarized from: {url}
                  <br />
                  Generated on: {new Date().toLocaleString()}
                </Typography>
              </Paper>

              <Collapse in={copied}>
                <Alert
                  severity="success"
                  sx={{ mt: 2, borderRadius: '12px' }}
                >
                  Summary copied to clipboard!
                </Alert>
              </Collapse>
            </motion.div>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default WebsiteSummary; 