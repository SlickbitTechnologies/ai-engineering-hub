import AudioFile from './AudioFile';
import Batch from './Batch';
import ConversationAnalysis from './ConversationAnalysis';
import ConversationTurn from './ConversationTurn';
import Transcription from './Transcription';
import ModelConfiguration from './ModelConfiguration';
import AnalysisSettings from './AnalysisSettings';
import User from './User';
import KPIMetric from './KPIMetric';

export const setupAssociations = () => {
  // AudioFile - Transcription
  AudioFile.hasOne(Transcription, {
    foreignKey: 'audioFileId',
    as: 'Transcription'
  });
  Transcription.belongsTo(AudioFile, {
    foreignKey: 'audioFileId',
    as: 'AudioFile'
  });

  // Transcription - ConversationAnalysis
  Transcription.hasOne(ConversationAnalysis, {
    foreignKey: 'transcriptionId',
    as: 'Analysis'
  });
  ConversationAnalysis.belongsTo(Transcription, {
    foreignKey: 'transcriptionId',
    as: 'Transcription'
  });

  // Transcription - ConversationTurn
  Transcription.hasMany(ConversationTurn, {
    foreignKey: 'transcriptionId',
    as: 'ConversationTurns'
  });
  ConversationTurn.belongsTo(Transcription, {
    foreignKey: 'transcriptionId',
    as: 'Transcription'
  });
};

export {
  AudioFile,
  Batch,
  ConversationAnalysis,
  ConversationTurn,
  Transcription,
  ModelConfiguration,
  AnalysisSettings,
  User,
  KPIMetric
}; 