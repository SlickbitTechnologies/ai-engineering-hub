import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Stack,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MessageIcon from '@mui/icons-material/Message';
import StarIcon from '@mui/icons-material/Star';
import AppBar from '../components/AppBar';
import { analyticsApi } from '../services/apiService';

const SentimentBar = ({ label, positive, neutral, negative }) => (
  <Box sx={{ mb: 3, width: '100%' }}>
    <Typography 
      variant="h6" 
      sx={{ 
        mb: 1, 
        color: '#0A1828',
        opacity: 0.9,
        fontWeight: 500,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ 
      height: 24, 
      display: 'flex', 
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <Box 
        sx={{ 
          width: `${positive}%`, 
          bgcolor: '#178582',
          transition: 'width 1s ease-in-out',
        }} 
      />
      <Box 
        sx={{ 
          width: `${neutral}%`, 
          bgcolor: '#BFA181',
          transition: 'width 1s ease-in-out',
        }} 
      />
      <Box 
        sx={{ 
          width: `${negative}%`, 
          bgcolor: '#FF6B6B',
          transition: 'width 1s ease-in-out',
        }} 
      />
    </Box>
    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
      <Typography variant="caption" sx={{ color: '#178582' }}>
        Positive: {positive}%
      </Typography>
      <Typography variant="caption" sx={{ color: '#BFA181' }}>
        Neutral: {neutral}%
      </Typography>
      <Typography variant="caption" sx={{ color: '#FF6B6B' }}>
        Negative: {negative}%
      </Typography>
    </Stack>
  </Box>
);

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        if (isMounted.current) {
          const data = await analyticsApi.getSentimentAnalysis();
          console.log("data", data);
          setAnalyticsData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        if (isMounted.current) {
          setError('Failed to load analytics data');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
    return () => {
      isMounted.current = false;
    };
  }, []);

  if (loading) {
    return (
      <>
        <AppBar showBackButton={false} />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'rgba(10, 24, 40, 0.02)',
        }}>
          <CircularProgress sx={{ color: '#178582' }} />
        </Box>
      </>
    );
  }

  if (error || !analyticsData) {
    return (
      <>
        <AppBar showBackButton={false} />
        <Box sx={{ 
          p: 4, 
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'rgba(10, 24, 40, 0.02)',
        }}>
          <Typography color="error" align="center">
            {error || 'No analytics data available'}
          </Typography>
        </Box>
      </>
    );
  }

  const { sentimentData, analyticsSummary, detailedData } = analyticsData;

  return (
    <>
      <AppBar showBackButton={false} />
      <Box sx={{ 
        p: 4, 
        minHeight: 'calc(100vh - 64px)',
        bgcolor: 'rgba(10, 24, 40, 0.02)',
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Paper 
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '20px',
              bgcolor: '#fff',
              boxShadow: '0 4px 20px rgba(10, 24, 40, 0.08)',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 4,
            }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#0A1828',
                  fontWeight: 600,
                }}
              >
                Sentiment Analysis
              </Typography>
              {sentimentData?.overallSentiment && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  color: '#178582',
                  bgcolor: 'rgba(23, 133, 130, 0.1)',
                  py: 1,
                  px: 2,
                  borderRadius: '12px',
                }}>
                  <SentimentVerySatisfiedIcon />
                  <Typography 
                    variant="subtitle1"
                    sx={{ fontWeight: 500 }}
                  >
                    {sentimentData.overallSentiment}
                  </Typography>
                </Box>
              )}
            </Box>

            {sentimentData && (
              <>
                <SentimentBar 
                  label="Food Quality"
                  {...sentimentData.foodQuality}
                />
                <SentimentBar 
                  label="Service"
                  {...sentimentData.service}
                />
                <SentimentBar 
                  label="Ambiance"
                  {...sentimentData.ambiance}
                />
              </>
            )}

            <Divider sx={{ my: 4, borderColor: 'rgba(10, 24, 40, 0.08)' }} />

            <Box sx={{ mt: 4 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 3,
                  color: '#0A1828',
                  fontWeight: 600,
                }}
              >
                Analytics Summary
              </Typography>

              <Grid container spacing={3}>
                {/* Key Metrics */}
                {analyticsSummary && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'rgba(23, 133, 130, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(23, 133, 130, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#0A1828', mb: 2 }}>
                        Key Metrics
                      </Typography>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <MessageIcon sx={{ color: '#178582' }} />
                          <Typography sx={{ color: '#0A1828' }}>
                            Total Reviews: <strong>{analyticsSummary.totalReviews || 0}</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <StarIcon sx={{ color: '#178582' }} />
                          <Typography sx={{ color: '#0A1828' }}>
                            Average Rating: <strong>{analyticsSummary.averageRating || 0}/5</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TrendingUpIcon sx={{ color: '#178582' }} />
                          <Typography sx={{ color: '#0A1828' }}>
                            Response Rate: <strong>{analyticsSummary.responseRate || '0%'}</strong>
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {/* Popular Items */}
                {detailedData?.topDishes?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'rgba(191, 161, 129, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(191, 161, 129, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#0A1828', mb: 2 }}>
                        Most Popular Dishes
                      </Typography>
                      <Stack spacing={1}>
                        {detailedData.topDishes.map((dish) => (
                          <Typography 
                            key={dish} 
                            sx={{ 
                              color: '#0A1828',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              '&:before': {
                                content: '""',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#BFA181',
                              }
                            }}
                          >
                            {dish}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {/* Common Phrases */}
                {detailedData?.commonPhrases?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'rgba(23, 133, 130, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(23, 133, 130, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#0A1828', mb: 2 }}>
                        Common Positive Phrases
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {detailedData.commonPhrases.map((phrase) => (
                          <Box
                            key={phrase}
                            sx={{
                              px: 2,
                              py: 0.5,
                              bgcolor: 'rgba(23, 133, 130, 0.1)',
                              borderRadius: '20px',
                              color: '#178582',
                            }}
                          >
                            {phrase}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {/* Areas for Improvement */}
                {detailedData?.improvement?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'rgba(255, 107, 107, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 107, 107, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#0A1828', mb: 2 }}>
                        Areas for Improvement
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {detailedData.improvement.map((item) => (
                          <Box
                            key={item}
                            sx={{
                              px: 2,
                              py: 0.5,
                              bgcolor: 'rgba(255, 107, 107, 0.1)',
                              borderRadius: '20px',
                              color: '#FF6B6B',
                            }}
                          >
                            {item}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}
                {
                  detailedData?.summary && (
                    <Grid item xs={12} >
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'rgba(255, 107, 107, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 107, 107, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#0A1828', mb: 2 }}>
                        Summary
                      </Typography>
                      <Typography sx={{ color: '#0A1828' }}>
                        {detailedData.summary}
                      </Typography>
                    </Box>
                  </Grid>
                  )
                  
                }
              </Grid>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
} 