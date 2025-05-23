import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config';

class ConversationAnalysis extends Model<InferAttributes<ConversationAnalysis>, InferCreationAttributes<ConversationAnalysis>> {
  declare id: string;
  declare transcriptionId: string;
  declare sentiment: string;
  declare sentimentScores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  declare customerMood: string;
  declare emotional: {
    satisfaction: number;
    frustration: number;
    confidence: number;
    confusion: number;
  };
  declare kpiMetrics: {
    [key: string]: number;
  };
  declare kpiScore: number;
  declare agentPerformance: {
    professionalism: number;
    helpfulness: number;
    clarity: number;
  };
  declare kpiAnalysis: {
    strengths: Array<{ title: string; description: string }>;
    improvements: Array<{ title: string; description: string }>;
  };
  declare createdAt: Date;
  declare updatedAt: Date;
}

ConversationAnalysis.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    transcriptionId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'transcriptions',
        key: 'id'
      }
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
    kpiAnalysis: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { strengths: [], improvements: [] }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'conversation_analyses',
    timestamps: true,
  }
);

export default ConversationAnalysis; 