import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: number;
  declare name: string;
  declare email: string;
  declare role: 'Admin' | 'Agent' | 'Viewer';
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Agent', 'Viewer'),
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'users',
  timestamps: true
});

export default User; 