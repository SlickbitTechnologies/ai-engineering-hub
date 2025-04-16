import { Router, Request, Response } from 'express';
import { ConfigurationService } from '../services/configuration.service';
import { ConfigurationServiceError } from '../utils/errors';

const router = Router();
const configService = new ConfigurationService();

// Error handler middleware
const handleError = (error: Error, res: Response): void => {
  console.error('Error:', error);
  
  if (error instanceof ConfigurationServiceError) {
    res.status(500).json({ error: error.message });
    return;
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

// Get complete configuration
const getCompleteConfiguration = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await configService.getCompleteConfiguration();
    res.json(config);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Update model configuration
const updateModelConfiguration = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await configService.updateModelConfiguration(req.body);
    res.json(config);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Update analysis settings
const updateAnalysisSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await configService.updateAnalysisSettings(req.body);
    res.json(settings);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Get all users
const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await configService.getAllUsers();
    res.json(users);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Create user
const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await configService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Update user
const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await configService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Delete user
const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    await configService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Get all KPIMetrics
const getKPIMetrics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await configService.getAllKPIMetrics();
    res.json(metrics);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Create KPIMetric
const createKPIMetric = async (req: Request, res: Response): Promise<void> => { 
  try {
    const metric = await configService.createKPIMetric(req.body);
    res.status(201).json(metric);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Update KPIMetric
const updateKPIMetric = async (req: Request, res: Response): Promise<void> => {
  try {
    const metric = await configService.updateKPIMetric(req.params.id, req.body);
    res.json(metric);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Delete KPIMetric
const deleteKPIMetric = async (req: Request, res: Response): Promise<void> => { 
  try {
    await configService.deleteKPIMetric(req.params.id);
    res.status(204).send();
  } catch (error) {
    handleError(error as Error, res);
  }
};
// Route definitions
router.get('/', getCompleteConfiguration);
router.put('/model', updateModelConfiguration);
router.put('/analysis-settings', updateAnalysisSettings);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/kpi-metrics', getKPIMetrics);
router.post('/kpi-metrics', createKPIMetric);
router.put('/kpi-metrics/:id', updateKPIMetric);
router.delete('/kpi-metrics/:id', deleteKPIMetric);

export default router;