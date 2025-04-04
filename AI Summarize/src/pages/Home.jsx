import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Language,
  PictureAsPdf,
  Headphones,
  TextFields,
  Translate
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const GradientText = ({ children, ...props }) => {
  const theme = useTheme();
  return (
    <Typography
      {...props}
      sx={{
        background: 'linear-gradient(45deg, #2196F3 30%, #00BCD4 90%)',
        backgroundClip: 'text',
        textFillColor: 'transparent',
        fontWeight: 'bold',
        ...props.sx
      }}
    >
      {children}
    </Typography>
  );
};

const FeatureCard = ({ feature, index }) => {
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });
  const navigate = useNavigate();

  const handleCardClick = () => {
    switch (feature.title) {
      case 'Website Summarization':
        navigate('/summarize/website');
        break;
      // Add other cases for different features
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <Card
        sx={{
          height: '100%',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <CardContent>
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 2,
                delay: index * 0.2
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(45deg, #2196F3 30%, #00BCD4 90%)',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  color: 'white',
                }}
              >
                {feature.icon}
              </Box>
            </motion.div>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <GradientText variant="h6" gutterBottom>
                {feature.title}
              </GradientText>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                }}
              >
                {feature.description}
              </Typography>
            </Box>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
};

const Home = () => {
  const features = [
    {
      title: 'Website Summarization',
      description: 'Extract key information from any website instantly',
      icon: <Language fontSize="large" />
    },
    {
      title: 'PDF Summary',
      description: 'Convert lengthy PDFs into concise summaries',
      icon: <PictureAsPdf fontSize="large" />
    },
    {
      title: 'Audio Transcription',
      description: 'Transform audio content into written summaries',
      icon: <Headphones fontSize="large" />
    },
    {
      title: 'Text Summarization',
      description: 'Condense long text into key points',
      icon: <TextFields fontSize="large" />
    },
    {
      title: 'Translation',
      description: 'Translate summaries into multiple languages',
      icon: <Translate fontSize="large" />
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 12, mb: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Grid
            // animate={{
            //   scale: [1, 1.02, 1],
            //   rotate: [0, 1, -1, 0],
            // }}
            // transition={{
            //   duration: 5,
            //   repeat: Infinity,
            //   repeatType: "reverse",
            // }}
          >
            <GradientText
              variant="h2"
              component="h1"
              sx={{
                mb: 2,
                fontSize: { xs: '2rem', md: '3.5rem' },
                textShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              Transform Content Instantly
            </GradientText>
          </Grid>
          <Typography
            variant="h5"
            sx={{
              color: 'text.secondary',
              fontWeight: 300,
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            Unleash the power of AI to summarize any content in seconds
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={6}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <FeatureCard feature={feature} index={index} />
          </Grid>
        ))}
      </Grid>

      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.8) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </Container>
  );
};

export default Home; 