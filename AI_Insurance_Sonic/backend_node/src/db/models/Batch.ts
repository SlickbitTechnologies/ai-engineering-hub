import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config';

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed';

class Batch extends Model<InferAttributes<Batch>, InferCreationAttributes<Batch>> {
  declare id: string;
  declare description: string;
  declare status: BatchStatus;
  declare total_audio_files: number;
  declare completed_files: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Batch.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  description: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    allowNull: false
  },
  total_audio_files: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completed_files: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Batch',
  tableName: 'batches'
});

export default Batch; 