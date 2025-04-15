import { DatabaseConnection } from './database';
import sequelize from './config';
import { DataTypes } from 'sequelize';

export async function createTables() {
  const db = DatabaseConnection.getInstance();
  const queryInterface = sequelize.getQueryInterface();

  try {
    // Create batches table
    await db.run(`
      CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY,
        description TEXT,
        status TEXT NOT NULL,
        total_audio_files INTEGER DEFAULT 0,
        completed_files INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create audio_files table
    await queryInterface.createTable('audio_files', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      batchId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      duration: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    });

    // Create model_configurations table
    await db.run(`
      CREATE TABLE IF NOT EXISTS model_configurations (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        model_name TEXT NOT NULL,
        api_key TEXT,
        temperature REAL DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 1000,
        top_p REAL DEFAULT 1.0,
        frequency_penalty REAL DEFAULT 0.0,
        presence_penalty REAL DEFAULT 0.0,
        system_prompt TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create analysis_settings table
    await db.run(`
      CREATE TABLE IF NOT EXISTS analysis_settings (
        id TEXT PRIMARY KEY,
        sentiment_analysis_enabled BOOLEAN DEFAULT true,
        keyword_extraction_enabled BOOLEAN DEFAULT true,
        topic_detection_enabled BOOLEAN DEFAULT true,
        summary_generation_enabled BOOLEAN DEFAULT true,
        action_items_detection_enabled BOOLEAN DEFAULT true,
        language TEXT DEFAULT 'en',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('admin', 'agent', 'viewer')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transcriptions table
    await queryInterface.createTable('transcriptions', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      audioFileId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'audio_files',
          key: 'id',
        },
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      agentName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    });

    // Create conversation_analyses table
    await queryInterface.createTable('conversation_analyses', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      transcriptionId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'transcriptions',
          key: 'id',
        },
      },
      sentiment: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sentimentScores: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      customerMood: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      emotional: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      kpiMetrics: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      kpiScore: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      agentPerformance: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    });

    // Create conversation_turns table
    await queryInterface.createTable('conversation_turns', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      transcriptionId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'transcriptions',
          key: 'id',
        },
      },
      speaker: {
        type: DataTypes.ENUM('Agent', 'Customer'),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sentiment: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    });

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Run migrations if executed directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} 