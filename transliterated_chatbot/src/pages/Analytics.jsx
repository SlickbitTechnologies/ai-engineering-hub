import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Stack,
  Grid,
  Divider,
  Skeleton,
  Fade,
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
        color: '#FFFFFF',
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
      bgcolor: 'rgba(255, 255, 255, 0.05)',
    }}>
      <Box 
        sx={{ 
          width: `${positive}%`, 
          bgcolor: 'rgba(76, 217, 100, 0.5)',
          transition: 'width 1s ease-in-out',
        }} 
      />
      <Box 
        sx={{ 
          width: `${neutral}%`, 
          bgcolor: 'rgba(123, 97, 255, 0.5)',
          transition: 'width 1s ease-in-out',
        }} 
      />
      <Box 
        sx={{ 
          width: `${negative}%`, 
          bgcolor: 'rgba(255, 107, 138, 0.5)',
          transition: 'width 1s ease-in-out',
        }} 
      />
    </Box>
    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
      <Typography variant="caption" sx={{ color: 'rgba(76, 217, 100, 0.8)' }}>
        Positive: {positive}%
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(123, 97, 255, 0.8)' }}>
        Neutral: {neutral}%
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255, 107, 138, 0.8)' }}>
        Negative: {negative}%
      </Typography>
    </Stack>
  </Box>
);

const LoadingSkeleton = () => (
  <Box sx={{ 
    p: 4, 
    minHeight: 'calc(100vh - 64px)',
    bgcolor: '#1A1B2E',
  }}>
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Fade in={true}>
        <Paper 
          elevation={0}
          sx={{
            p: 4,
            borderRadius: '20px',
            bgcolor: '#242642',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header Skeleton */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 4,
          }}>
            <Skeleton 
              variant="text" 
              width={300} 
              height={48}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
              }} 
            />
            <Skeleton 
              variant="rounded" 
              width={120} 
              height={40}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
              }} 
            />
          </Box>

          {/* Sentiment Bars Skeleton */}
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ mb: 3, width: '100%' }}>
              <Skeleton 
                variant="text" 
                width={200} 
                height={32}
                sx={{ 
                  mb: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1,
                }} 
              />
              <Skeleton 
                variant="rounded" 
                width="100%" 
                height={24}
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                }} 
              />
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                {[1, 2, 3].map((stat) => (
                  <Skeleton 
                    key={stat}
                    variant="text" 
                    width={100} 
                    height={20}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                    }} 
                  />
                ))}
              </Stack>
            </Box>
          ))}

          <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Analytics Cards Skeleton */}
          <Box sx={{ mt: 4 }}>
            <Skeleton 
              variant="text" 
              width={250} 
              height={40}
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 1,
              }} 
            />

            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((card) => (
                <Grid item xs={12} md={6} key={card}>
                  <Skeleton 
                    variant="rounded" 
                    width="100%" 
                    height={200}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 3,
                    }} 
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Fade>
    </Box>
  </Box>
);

const Analytics = () => {
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
        <AppBar />
        <LoadingSkeleton />
      </>
    );
  }

  if (error || !analyticsData) {
    return (
      <>
        <AppBar  />
        <Box sx={{ 
          p: 4, 
          minHeight: 'calc(100vh - 64px)',
          bgcolor: '#1A1B2E',
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
      <AppBar  />
      <Box sx={{ 
        p: 4, 
        minHeight: 'calc(100vh - 64px)',
        bgcolor: '#1A1B2E',
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Paper 
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '20px',
              bgcolor: '#242642',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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
                  color: '#FFFFFF',
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
                  color: '#7B61FF',
                  bgcolor: 'rgba(123, 97, 255, 0.1)',
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

            <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            <Box sx={{ mt: 4 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 3,
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                Analytics Summary
              </Typography>

              <Grid container spacing={3}>
                {analyticsSummary && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: '#2D2F52',
                      borderRadius: '16px',
                      border: '1px solid rgba(123, 97, 255, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                        Key Metrics
                      </Typography>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <MessageIcon sx={{ color: '#7B61FF' }} />
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            Total Reviews: <strong>{analyticsSummary.totalReviews || 0}</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <StarIcon sx={{ color: '#7B61FF' }} />
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            Average Rating: <strong>{analyticsSummary.averageRating || 0}/5</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TrendingUpIcon sx={{ color: '#7B61FF' }} />
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            Response Rate: <strong>{analyticsSummary.responseRate || '0%'}</strong>
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {detailedData?.topDishes?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: '#2D2F52',
                      borderRadius: '16px',
                      border: '1px solid rgba(76, 217, 100, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                        Most Popular Dishes
                      </Typography>
                      <Stack spacing={1}>
                        {detailedData.topDishes.map((dish) => (
                          <Typography 
                            key={dish} 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.9)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              '&:before': {
                                content: '""',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#4CD964',
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

                {detailedData?.commonPhrases?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: '#2D2F52',
                      borderRadius: '16px',
                      border: '1px solid rgba(123, 97, 255, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                        Common Positive Phrases
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {detailedData.commonPhrases.map((phrase) => (
                          <Box
                            key={phrase}
                            sx={{
                              px: 2,
                              py: 0.5,
                              bgcolor: 'rgba(123, 97, 255, 0.1)',
                              borderRadius: '20px',
                              color: '#7B61FF',
                            }}
                          >
                            {phrase}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {detailedData?.improvement?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: '#2D2F52',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 107, 138, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                        Areas for Improvement
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {detailedData.improvement.map((item) => (
                          <Box
                            key={item}
                            sx={{
                              px: 2,
                              py: 0.5,
                              bgcolor: 'rgba(255, 107, 138, 0.1)',
                              borderRadius: '20px',
                              color: '#FF6B8A',
                            }}
                          >
                            {item}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {detailedData?.summary && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: '#2D2F52',
                      borderRadius: '16px',
                      border: '1px solid rgba(123, 97, 255, 0.1)',
                    }}>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                        Summary
                      </Typography>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {detailedData.summary}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
} 

export default Analytics;