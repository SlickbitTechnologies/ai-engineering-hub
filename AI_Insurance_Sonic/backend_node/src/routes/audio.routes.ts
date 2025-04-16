import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AudioService } from '../services/audio.service';
import { AudioServiceError, FileNotFoundError, BatchNotFoundError, InvalidFileError, StorageError } from '../utils/errors';

const router = Router();
const audioService = new AudioService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// Error handler middleware
const handleError = (error: Error, res: Response): void => {
  console.error('Error:', error);
  
  if (error instanceof BatchNotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof FileNotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof InvalidFileError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof StorageError) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (error instanceof AudioServiceError) {
    res.status(500).json({ error: error.message });
    return;
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

// Create a new batch
const createBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Creating new batch');
    const { name } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Description is required' });
      return;
    }
    
    const batch = await audioService.createBatch(name);
    console.log('Batch created:', batch);
    res.status(201).json(batch);
  } catch (error) {
    console.error('Error creating batch:', error);
    handleError(error as Error, res);
  }
};

// Update batch status
const updateBatchStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Updating batch status');
    const { status } = req.body;
    const { batchId } = req.params;
    
    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }
    
    await audioService.updateBatchStatus(batchId, status);
    res.status(200).json({ message: 'Batch status updated successfully' });
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Delete batch
const deleteBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Deleting batch');
    const { batchId } = req.params;
    await audioService.deleteBatch(batchId);
    res.status(204).send();
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Upload audio files
const uploadAudioFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Processing audio files upload');
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ error: 'No audio files provided' });
      return;
    }

    await audioService.uploadAudioFiles(req.files, req.params.batchId);
    res.status(201).json({ message: 'Files uploaded successfully' });
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Get all audio files
const getAudioFiles = async (req: Request, res: Response) => {
  try {
    console.log('Fetching audio files');
    const { batchId } = req.query;
    const audioFiles = await audioService.getAudioFilesByBatch(batchId as string);
    res.json(audioFiles);
  } catch (error) {
    console.error('Error fetching audio files:', error);
    res.status(500).json({ error: 'Failed to fetch audio files' });
  }
};

// Get all batches
const getBatches = async (req: Request, res: Response) => {
  try {
    console.log('Fetching batches');
    const batches = await audioService.getBatches();
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
};

// Delete an audio file
const deleteAudioFile = async (req: Request, res: Response) => {
  try {
    console.log('Deleting audio file');
    await audioService.deleteAudioFile(req.params.fileId);
    res.status(204).send();
  } catch (error) {
    handleError(error as Error, res);
  }
};

// Download audio file

const downloadAudioFile = async (req: Request, res: Response) => {
  try {
    const downloadUrl = await audioService.getDownloadUrl(req.params.fileId);
    res.json({ url: downloadUrl });
  } catch (error) {
    handleError(error as Error, res);
  }
};
// Route definitions
router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.put('/batches/:batchId', updateBatchStatus);
router.delete('/batches/:batchId', deleteBatch);
router.post('/batches/:batchId/upload', upload.array('files'), uploadAudioFiles);
router.get('/batches/:batchId/files', getAudioFiles);
router.delete('/files/:fileId', deleteAudioFile);
router.get('/files/:fileId/download', downloadAudioFile);

export default router