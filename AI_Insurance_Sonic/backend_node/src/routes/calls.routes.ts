import { Router, Request, Response } from 'express';
import { CallsService } from '../services/calls.service';
import { CallServiceError } from '../utils/errors';

const router = Router();
const callsService = new CallsService();

// Error handler middleware
const handleError = (error: Error, res: Response): void => {
  console.error('Error:', error);
  
  if (error instanceof CallServiceError) {
    res.status(404).json({ error: error.message });
    return;
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

// Get all calls with pagination and filters
const getCalls = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      agent,
      category,
      sentiment
    } = req.query;

    const result = await callsService.getCalls({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      startDate: startDate as string,
      endDate: endDate as string,
      agent: agent as string,
      category: category as string,
      sentiment: sentiment as string
    });

    res.json(result);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Get call by ID
const getCallById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await callsService.getCallById(id);
    res.json(result);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Route definitions
router.get('/', getCalls);
router.get('/:id', getCallById);

export default router; 