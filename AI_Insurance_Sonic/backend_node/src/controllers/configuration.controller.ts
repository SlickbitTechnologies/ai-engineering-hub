import { Router } from 'express';
import { ConfigurationService } from '../services/configuration.service';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const configService = new ConfigurationService();

// KPI Metrics validation schemas
const kpiMetricSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  enabled: z.boolean()
});

const updateKpiMetricSchema = kpiMetricSchema.partial();

// Get all KPI metrics
router.get('/kpi-metrics', async (req, res, next) => {
  try {
    const metrics = await configService.getAllKPIMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// Create KPI metric
router.post('/kpi-metrics', validateRequest({ body: kpiMetricSchema }), async (req, res, next) => {
  try {
    const metric = await configService.createKPIMetric(req.body);
    res.status(201).json(metric);
  } catch (error) {
    next(error);
  }
});

// Update KPI metric
router.patch('/kpi-metrics/:id', validateRequest({ body: updateKpiMetricSchema }), async (req, res, next) => {
  try {
    const metric = await configService.updateKPIMetric(req.params.id, req.body);
    res.json(metric);
  } catch (error) {
    next(error);
  }
});

// Delete KPI metric
router.delete('/kpi-metrics/:id', async (req, res, next) => {
  try {
    await configService.deleteKPIMetric(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ... existing routes ...

export default router; 