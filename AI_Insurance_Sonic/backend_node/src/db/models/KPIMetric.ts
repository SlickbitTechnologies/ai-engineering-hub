import { Model, DataTypes } from 'sequelize';
import sequelize from '../config';

class KPIMetric extends Model {
  public id!: string;
  public key!: string;
  public name!: string;
  public description!: string;
  public enabled!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

KPIMetric.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'KPIMetric',
    tableName: 'kpi_metrics',
    timestamps: true,
  }
);

export default KPIMetric; 