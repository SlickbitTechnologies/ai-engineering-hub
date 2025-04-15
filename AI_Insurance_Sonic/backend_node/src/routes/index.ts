import { Router } from 'express';
import audioRoutes from './audio.routes';
import configurationRoutes from './configuration.routes';
import callsRoutes from './calls.routes';
import dashboardRoutes from './dashboard.routes';
const router = Router();

router.use('/audio', audioRoutes);
router.use('/configuration', configurationRoutes);
router.use('/calls', callsRoutes);
router.use('/dashboard', dashboardRoutes);
export default router; 