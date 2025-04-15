import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config';

class AnalysisSettings extends Model<InferAttributes<AnalysisSettings>, InferCreationAttributes<AnalysisSettings>> {
  declare id: number;
  declare sentiment_analysis_enabled: boolean;
  declare keyword_extraction_enabled: boolean;
  declare topic_detection_enabled: boolean;
}

AnalysisSettings.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sentiment_analysis_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  keyword_extraction_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  topic_detection_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  tableName: 'analysis_settings',
  timestamps: true
});

export default AnalysisSettings; 