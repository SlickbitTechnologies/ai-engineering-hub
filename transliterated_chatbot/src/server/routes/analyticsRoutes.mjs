import express from 'express';
import { 
  getSentimentAnalysis
} from '../controllers/analyticsController.mjs';
import { verifyToken } from '../middleware/auth.mjs';

const router = express.Router();

// Apply authentication middleware to all analytics routes
router.use(verifyToken);

// Get overall sentiment analysis
router.get('/sentiment', getSentimentAnalysis);


export default router; 