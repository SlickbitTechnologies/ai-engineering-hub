// chatbot-backend/routes/chatRoutes.js
import express from 'express';
// Use named import for the controller function
import { handleChatMessage } from '../controllers/chatController.mjs'; // Add .js
import { verifyToken } from '../middleware/auth.mjs';

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(verifyToken);

router.post('/chat', handleChatMessage);

// Use 'export default' for the router
export default router;