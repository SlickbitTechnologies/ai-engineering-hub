import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config';
import Batch from './Batch';

class AudioFile extends Model<InferAttributes<AudioFile>, InferCreationAttributes<AudioFile>> {
  declare id: string;
  declare fileName: string;
  declare originalName: string;
  declare mimeType: string;
  declare size: number;
  declare url: string;
  declare status: string;
  declare batchId: string;
  declare duration: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

AudioFile.init(
  {
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
      references: {
        model: Batch,
        key: 'id',
      },
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
  },
  {
    sequelize,
    tableName: 'audio_files',
    timestamps: true,
  }
);

export default AudioFile; 