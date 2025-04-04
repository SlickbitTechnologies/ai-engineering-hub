import { AppBar, Toolbar, Typography, Button, Container, useScrollTrigger, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Header = () => {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return (
    <AppBar position="sticky" elevation={trigger ? 4 : 0}>
      <Container maxWidth="lg">
        <Toolbar sx={{display: 'flex', justifyContent:'space-between'}}>
        <Grid>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'white',
                flexGrow: 1,
                fontWeight: 'bold',
                '&:hover': {
                  textShadow: '0 0 8px rgba(255,255,255,0.5)',
                }
              }}
            >
              SummarizeAI
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mr: 4,
                display: { xs: 'none', md: 'block' },
                fontStyle: 'italic'
              }}
            >
              Summarize Anything, Instantly!
            </Typography>
          </motion.div>
        </Grid>

        <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        >
        {['Home', 'History'].map((item, index) => (
            <Button
            key={item}
            color="inherit"
            component={Link}
            to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
            sx={{
                ml: 2,
                position: 'relative',
                '&::after': {
                content: '""',
                position: 'absolute',
                width: '0%',
                height: '2px',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'white',
                transition: 'width 0.3s ease-in-out'
                },
                '&:hover::after': {
                width: '80%'
                }
            }}
            >
            {item}
            </Button>
        ))}
        </motion.div>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 