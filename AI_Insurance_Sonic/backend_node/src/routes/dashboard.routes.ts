import { Router, Request, Response } from 'express';
import { DashboardService } from '../services';

const router = Router();
const dashboardService = new DashboardService();

// Error handler middleware
const handleError = (error: Error, res: Response): void => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
};

// Get dashboard metrics
const getDashboardMetrics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await dashboardService.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Get call volume trend
const getCallVolumeTrend = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeframe = 'week' } = req.query;
    const trend = await dashboardService.getCallVolumeTrend(timeframe as string);
    res.json(trend);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Get KPI performance
const getKpiPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeframe = 'month' } = req.query;
    const performance = await dashboardService.getKpiPerformance(timeframe as string);
    res.json(performance);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Get customer sentiment trend
const getSentimentTrend = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeframe = 'month' } = req.query;
    const trend = await dashboardService.getSentimentTrend(timeframe as string);
    res.json(trend);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Get recent calls
const getRecentCalls = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '5' } = req.query;
    const calls = await dashboardService.getRecentCalls(parseInt(limit as string));
    res.json(calls);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Route definitions
router.get('/metrics', getDashboardMetrics);
router.get('/call-volume', getCallVolumeTrend);
router.get('/kpi-performance', getKpiPerformance);
router.get('/sentiment-trend', getSentimentTrend);
router.get('/recent-calls', getRecentCalls);

export default router; 