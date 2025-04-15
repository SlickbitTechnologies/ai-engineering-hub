import { Router } from 'express';
import audioRoutes from './audio.routes';
import configurationRoutes from './configuration.routes';
import callsRoutes from './calls.routes';

const router = Router();

router.use('/audio', audioRoutes);
router.use('/configuration', configurationRoutes);
router.use('/calls', callsRoutes);

export default router; 