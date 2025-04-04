import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, ContentCopy, OpenInNew, History as HistoryIcon } from '@mui/icons-material';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const History = () => {
  const [history, setHistory] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    setHistory(savedHistory);
  };

  const handleDelete = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem('summaryHistory', JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
  };

  const handleCopy = (summary) => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
  };

  const renderMarkdown = (content) => {
    const sanitizedHtml = DOMPurify.sanitize(marked(content));
    return { __html: sanitizedHtml };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <HistoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography
            variant="h4"
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #00BCD4 90%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              fontWeight: 'bold',
            }}
          >
            Summarized History
          </Typography>
        </Box>

        {history.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
            }}
          >
            <Typography color="text.secondary">
              No summaries yet. Start by summarizing a website!
            </Typography>
          </Paper>
        ) : (
          <AnimatePresence>
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    mb: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    display:'flex',
                    alignItems:'center',
                    flexDirection: 'row',
                    justifyContent:'space-between'
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        // mb: 1,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        // gap: 1,
                      }}
                    >
                      <OpenInNew fontSize="small" />
                      {item.url}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Summarized on: {new Date(item.timestamp).toLocaleString()}
                    </Typography>
                    <Box
                      sx={{
                        mt: 2,
                        maxHeight: '100px',
                        overflow: 'hidden',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '50px',
                          background: 'linear-gradient(transparent, rgba(255,255,255,0.9))',
                        },
                      }}
                    >
                      {/* <div dangerouslySetInnerHTML={renderMarkdown(item.summary)} /> */}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                    <Button
                      size="small"
                      startIcon={<ContentCopy />}
                      onClick={() => handleCopy(item.summary)}
                    >
                      Copy
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedSummary(item)}
                    >
                      View Full Summary
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      <Dialog
        open={!!selectedSummary}
        onClose={() => setSelectedSummary(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedSummary && (
          <>
            <DialogTitle>
              <Typography variant="h6" component="div">
                {selectedSummary.url}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Summarized on: {new Date(selectedSummary.timestamp).toLocaleString()}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ 
                '& h1, & h2': { 
                  color: 'primary.main',
                  mb: 2,
                },
                '& p': {
                  mb: 2,
                  lineHeight: 1.8,
                },
              }}>
                <div dangerouslySetInnerHTML={renderMarkdown(selectedSummary.summary)} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedSummary(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Summary copied to clipboard!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default History; 