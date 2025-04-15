import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/initialize';
import routes from './routes/index';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize routes
app.use('/api', routes);

// Initialize database
initializeDatabase().catch(console.error);

export default app; 