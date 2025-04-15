import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { errorHandler } from './middleware/error.middleware';
import audioRoutes from './routes/audio.routes';
import configurationRoutes from './routes/configuration.routes';
import path from 'path';
import { DatabaseConnection } from './db/database';
import { initializeDatabase } from './db/initialize';
import './config/firebase'; // Import for side effects only
import callsRoutes from './routes/calls.routes';

// Initialize environment variables
dotenv.config();

// Create Express application
const app: Express = express();
const db = DatabaseConnection.getInstance();
const port = parseInt(process.env.PORT || '4000', 10);

console.log('Starting server with configuration:');
console.log(`- PORT: ${port}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  console.log('Health check endpoint called');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: port
  });
});

// Test route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

// Routes
const router = express.Router();
router.use('/analyze', audioRoutes);
router.use('/configuration', configurationRoutes);
router.use('/calls', callsRoutes);
app.use('/api/v1', router);

// Error handling
app.use(errorHandler);

// Handle 404
app.use((req: Request, res: Response) => {
  console.log('404 - Route not found:', req.url);
  res.status(404).json({
    status: 'fail',
    message: 'Route not found'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    return new Promise((resolve, reject) => {
      const server = app.listen(port, '0.0.0.0', () => {
        console.log(`Server is running at http://localhost:${port}`);
        console.log(`Also accessible at http://0.0.0.0:${port}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log('Available routes:');
        console.log('- GET  /');
        console.log('- GET  /health');
        console.log('- GET  /api/v1/analyze/batches');
        console.log('- POST /api/v1/analyze/batches');
        console.log('- PUT  /api/v1/analyze/batches/:batchId');
        console.log('- POST /api/v1/analyze/batches/:batchId/files');
        console.log('- GET  /api/v1/configuration');
        console.log('- PUT  /api/v1/configuration/model');
        console.log('- PUT  /api/v1/configuration/analysis-settings');
        console.log('- GET  /api/v1/configuration/users');
        console.log('- POST /api/v1/configuration/users');
        console.log('- PUT  /api/v1/configuration/users/:id');
        console.log('- DELETE /api/v1/configuration/users/:id');
        resolve(server);
      }).on('error', (err) => {
        console.error('Error starting server:', err);
        reject(err);
      });

      // Handle graceful shutdown
      process.on('SIGTERM', async () => {
        console.log('SIGTERM received. Closing HTTP server and database connection...');
        server.close();
        await db.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app; 