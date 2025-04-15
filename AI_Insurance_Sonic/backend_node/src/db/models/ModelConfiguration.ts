import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config';

class ModelConfiguration extends Model<InferAttributes<ModelConfiguration>, InferCreationAttributes<ModelConfiguration>> {
  declare id: number;
  declare provider: string;
  declare model_name: string;
  declare api_key: string;
  declare max_tokens: number;
  declare temperature: number;
  declare top_p: number;
  declare frequency_penalty: number;
  declare presence_penalty: number;
  declare system_prompt: string;
}

ModelConfiguration.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  api_key: {
    type: DataTypes.STRING,
    allowNull: false
  },
  max_tokens: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  top_p: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  frequency_penalty: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  presence_penalty: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  system_prompt: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'model_configurations',
  timestamps: true
});

export default ModelConfiguration; 