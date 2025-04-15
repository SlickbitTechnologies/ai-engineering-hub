import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config';

class ConversationTurn extends Model<InferAttributes<ConversationTurn>, InferCreationAttributes<ConversationTurn>> {
  declare id: string;
  declare transcriptionId: string;
  declare speaker: "Agent" | "Customer";
  declare content: string;
  declare sequence: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ConversationTurn.init(
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
    tableName: 'conversation_turns',
    timestamps: true,
  }
);

export default ConversationTurn; 