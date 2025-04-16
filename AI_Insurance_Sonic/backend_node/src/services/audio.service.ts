import { v4 as uuidv4 } from 'uuid';
import AudioFile from '../db/models/AudioFile';
import Batch, { BatchStatus } from '../db/models/Batch';
import Transcription from '../db/models/Transcription';
import ConversationAnalysis from '../db/models/ConversationAnalysis';
import ConversationTurn from '../db/models/ConversationTurn';
import { uploadToStorage, deleteFromStorage } from '../config/firebase';
import { transcribeAndAnalyze } from '../config/openai';
import { AudioServiceError, FileNotFoundError, BatchNotFoundError, InvalidFileError, StorageError } from '../utils/errors';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import whisper from 'whisper-node';
import sequelize from '../db/config';
import { getStorage } from 'firebase-admin/storage';

export class AudioService {
  constructor() {}

  async createBatch(description: string): Promise<Batch> {
    const batch = await Batch.create({
      id: uuidv4(),
      description,
      status: 'pending' as BatchStatus,
      total_audio_files: 0,
      completed_files: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Batch created:', batch);
    return batch;
  }

  async updateBatchStatus(batchId: string, newStatus: BatchStatus): Promise<void> {
    const batch = await Batch.findByPk(batchId);
    if (!batch) {
      throw new BatchNotFoundError('Batch not found');
    }
    await batch.update({ status: newStatus });
  }

  async deleteBatch(batchId: string): Promise<void> {
    const batch = await Batch.findByPk(batchId);
    if (!batch) {
      throw new BatchNotFoundError('Batch not found');
    }
    await this.deleteAudioFilesByBatch(batchId);
    await batch.destroy();
  }

  async getBatches(): Promise<Batch[]> {
    return await Batch.findAll({
      order: [['createdAt', 'DESC']]
    });
  }

  async testWhisperTranscription(audioBuffer: Buffer, fileName: string): Promise<void> {
    const tempFile = path.join(os.tmpdir(), fileName);
    try {
      // Save buffer to temporary file for whisper
      await fs.writeFile(tempFile, audioBuffer);
      
      // Test whisper transcription
      const options = {
        modelName: "base.en",       // default
        // modelPath: "/custom/path/to/model.bin", // use model in a custom directory (cannot use along with 'modelName')
        whisperOptions: {
          language: 'auto' ,    
          gen_file_txt: false,
          gen_file_subtitle: false, // outputs .srt file
          gen_file_vtt: false,      // outputs .vtt file
          word_timestamps: true     // timestamp for every word
          // timestamp_size: 0      // cannot use along with word_timestamps:true
        }
      }
      console.log('Testing Whisper transcription...',options);

      const result = await whisper(tempFile,options);
      
      console.log('Whisper transcription result:', result);
    } catch (error) {
      console.error('Whisper transcription error:', error);
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile);
      } catch (error) {
        console.error('Error cleaning up temporary file:', error);
      }
    }
  }

  async saveAudioFile(file: Express.Multer.File, batchId: string): Promise<AudioFile> {
    console.log('Saving audio file:', file.originalname);
    
    if (!file || !file.buffer) {
      throw new InvalidFileError('No file provided');
    }

    // Test whisper transcription without affecting the main flow
    await this.testWhisperTranscription(file.buffer, file.originalname);

    const t = await sequelize.transaction();
    let fileName = '';
    let tempFile = '';

    try {
      const fileId = uuidv4();
      const fileExtension = file.originalname.split('.').pop();
      fileName = `audio/${batchId}/${fileId}.${fileExtension}`;

      // Save buffer to temporary file for duration calculation
      tempFile = path.join(os.tmpdir(), `${fileId}.${fileExtension}`);
      await fs.writeFile(tempFile, file.buffer);
      
      // Calculate audio duration
      const duration = await getAudioDurationInSeconds(tempFile);

      // Upload to Firebase Storage
      const url = await uploadToStorage(file.buffer, fileName, file.mimetype);

      // Get transcription and analysis from OpenAI
      console.log('Analyzing audio file...');
      const analysis = await transcribeAndAnalyze(file.buffer, file.originalname);

      // Create audio file record
      const audioFile = await AudioFile.create({
        id: fileId,
        fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        status: 'pending',
        batchId,
        duration,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { transaction: t });

      // Create transcription record
      const transcription = await Transcription.create({
        id: uuidv4(),
        audioFileId: fileId,
        text: analysis.transcription,
        summary: analysis.summary,
        category: analysis.category,
        agentName: analysis.agentName,
        customerName: analysis.customerName,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { transaction: t });

      // Create conversation analysis record
      await ConversationAnalysis.create({
        id: uuidv4(),
        transcriptionId: transcription.id,
        sentiment: analysis.sentiment,
        sentimentScores: analysis.sentimentAnalysis,
        customerMood: analysis.customerMood,
        emotional: analysis.emotional,
        kpiMetrics: analysis.kpiMetrics,
        kpiScore: analysis.kpiScore,
        agentPerformance: analysis.agentPerformance,
        kpiAnalysis: analysis.kpiAnalysis,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { transaction: t });

      // Create conversation turns
      await Promise.all(
        analysis.conversation.map((turn, index) =>
          ConversationTurn.create({
            id: uuidv4(),
            transcriptionId: transcription.id,
            speaker: turn.speaker,
            content: turn.content,
            sequence: index,
            createdAt: new Date(),
            updatedAt: new Date()
          }, { transaction: t })
        )
      );

      await t.commit();
      return audioFile;
    } catch (error) {
      await t.rollback();
      console.error('Error saving audio file:', error);
      
      // Try to clean up the uploaded file if it exists
      try {
        if (fileName) {
          await deleteFromStorage(fileName);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
      
      throw new StorageError('Failed to save audio file');
    } finally {
      // Clean up temporary file
      if (tempFile) {
        try {
          await fs.unlink(tempFile);
        } catch (error) {
          console.error('Error cleaning up temporary file:', error);
        }
      }
    }
  }

  async getAudioFile(fileId: string): Promise<AudioFile> {
    const audioFile = await AudioFile.findByPk(fileId);
    if (!audioFile) {
      throw new FileNotFoundError('Audio file not found');
    }
    return audioFile;
  }

  async getAudioFilesByBatch(batchId: string): Promise<AudioFile[]> {
    const audioFiles = await AudioFile.findAll({
      where: { batchId },
      order: [['createdAt', 'DESC']]
    });
    return audioFiles;
  }

  async deleteAudioFile(fileId: string): Promise<void> {
    const audioFile = await AudioFile.findByPk(fileId);
    if (!audioFile) {
      throw new FileNotFoundError('Audio file not found');
    }

    try {
      await deleteFromStorage(audioFile.fileName);
      await audioFile.destroy();
    } catch (error) {
      console.error('Error deleting audio file:', error);
      throw new StorageError('Failed to delete audio file');
    }
  }

  async deleteAudioFilesByBatch(batchId: string): Promise<void> {
    const audioFiles = await AudioFile.findAll({
      where: { batchId }
    });

    if (audioFiles.length === 0) {
      throw new BatchNotFoundError('Batch not found');
    }

    try {
      for (const file of audioFiles) {
        await deleteFromStorage(file.fileName);
        await file.destroy();
      }
    } catch (error) {
      console.error('Error deleting batch files:', error);
      throw new StorageError('Failed to delete batch files');
    }
  }

  async uploadAudioFiles(files: Express.Multer.File[], batchId: string): Promise<void> {
    console.log(`Starting upload process for batch ${batchId} with ${files.length} files`);
    
    // Update total_audio_files at the start
    await Batch.update(
      { 
        total_audio_files: files.length,
        completed_files: 0,
        status: 'processing' as BatchStatus
      },
      { where: { id: batchId } }
    );

    let completedFiles = 0;
    
    for (const file of files) {
      try {
        await this.saveAudioFile(file, batchId);
        completedFiles++;
        
        // Update completed_files count after each successful upload
        await Batch.update(
          { completed_files: completedFiles },
          { where: { id: batchId } }
        );
        
        console.log(`Successfully processed file ${completedFiles}/${files.length} in batch ${batchId}`);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        throw error;
      }
    }

    // Update batch status to completed
    await Batch.update(
      { status: 'completed' as BatchStatus },
      { where: { id: batchId } }
    );
    
    console.log(`Completed processing all files for batch ${batchId}`);
  }

  async getDownloadUrl(fileId: string): Promise<string> {
    try {
      const audioFile = await AudioFile.findByPk(fileId);
      if (!audioFile) {
        throw new FileNotFoundError('Audio file not found');
      }

      const bucket = getStorage().bucket();
      const file = bucket.file(audioFile.fileName);
      
      // Generate a signed URL that expires in 1 hour
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      return url;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new StorageError('Failed to get download URL');
    }
  }
} 