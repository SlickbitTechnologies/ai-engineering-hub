import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ViteExpress from "vite-express";
import restaurantRoutes from './routes/restaurantRoutes.mjs';
import chatRoutes from './routes/chatRoutes.mjs';
import analyticsRoutes from './routes/analyticsRoutes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ dest: 'pdf/' });

app.use(cors());
app.use(express.json());

app.use('/api', chatRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 4001;
ViteExpress.listen(app, PORT, () =>
  console.log(`Server is listening on port ${PORT}...`),
);
