import sequelize from './config';
import Batch from './models/Batch';
import AudioFile from './models/AudioFile';
import Transcription from './models/Transcription';
import ConversationAnalysis from './models/ConversationAnalysis';
import ConversationTurn from './models/ConversationTurn';

// Define relationships after all models are initialized
const defineRelationships = () => {
  AudioFile.belongsTo(Batch, { foreignKey: 'batchId' });
  Batch.hasMany(AudioFile, { foreignKey: 'batchId' });

  Transcription.belongsTo(AudioFile, { foreignKey: 'audioFileId' });
  AudioFile.hasOne(Transcription, { foreignKey: 'audioFileId' });

  ConversationAnalysis.belongsTo(Transcription, { foreignKey: 'transcriptionId' });
  Transcription.hasOne(ConversationAnalysis, { foreignKey: 'transcriptionId' });

  ConversationTurn.belongsTo(Transcription, { foreignKey: 'transcriptionId' });
  Transcription.hasMany(ConversationTurn, { foreignKey: 'transcriptionId' });
};

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    defineRelationships();

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export {
  sequelize,
  Batch,
  AudioFile,
  Transcription,
  ConversationAnalysis,
  ConversationTurn,
  initializeDatabase
}; 