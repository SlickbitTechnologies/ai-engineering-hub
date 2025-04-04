import { Box } from '@mui/material';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            background: `rgba(33, 150, 243, ${0.1 - i * 0.02})`,
            borderRadius: '50%',
            filter: 'blur(100px)',
          }}
          animate={{
            x: ['-20%', '20%'],
            y: ['-20%', '20%'],
            scale: [1, 1.5],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          initial={{
            width: '60%',
            height: '60%',
            left: `${Math.random() * 40}%`,
            top: `${Math.random() * 40}%`,
          }}
        />
      ))}
    </Box>
  );
};

export default AnimatedBackground; 