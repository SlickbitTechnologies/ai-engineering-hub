import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config';

class Transcription extends Model<InferAttributes<Transcription>, InferCreationAttributes<Transcription>> {
  declare id: string;
  declare audioFileId: string;
  declare text: string;
  declare summary: string;
  declare category: string;
  declare agentName: string | null;
  declare customerName: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Transcription.init(
  {
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
  },
  {
    sequelize,
    tableName: 'transcriptions',
    timestamps: true,
  }
);

export default Transcription; 