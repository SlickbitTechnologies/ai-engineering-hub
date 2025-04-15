import sequelize from './config';
import { createTables } from './migrations';
import './models/AudioFile';
import './models/Transcription';
import './models/ConversationAnalysis';
import './models/ConversationTurn';
import { setupAssociations } from './models/associations';

export const initializeDatabase = async () => {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Setup model associations
    setupAssociations();

    // Run migrations
    await createTables();
    console.log('Database migrations completed successfully.');
  } catch (error) {
    console.error('Unable to connect to the database or run migrations:', error);
    throw error;
  }
};

export default { initializeDatabase }; 