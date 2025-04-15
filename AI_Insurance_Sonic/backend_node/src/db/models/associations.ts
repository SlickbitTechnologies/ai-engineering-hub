import AudioFile from './AudioFile';
import Transcription from './Transcription';
import ConversationAnalysis from './ConversationAnalysis';
import ConversationTurn from './ConversationTurn';

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