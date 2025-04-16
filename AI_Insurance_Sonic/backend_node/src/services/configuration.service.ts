import ModelConfiguration from '../db/models/ModelConfiguration';
import AnalysisSettings from '../db/models/AnalysisSettings';
import User from '../db/models/User';
import KPIMetric from '../db/models/KPIMetric';
import { ConfigurationServiceError } from '../utils/errors';

export class ConfigurationService {
  // Get complete configuration
  async getCompleteConfiguration() {
    try {
      console.log('Fetching complete configuration');
      const [modelConfig, analysisSettings, users] = await Promise.all([
        ModelConfiguration.findOne({ order: [['createdAt', 'DESC']] }),
        AnalysisSettings.findOne({ order: [['createdAt', 'DESC']] }),
        User.findAll()
      ]);

      return { ai_model_config: modelConfig, analysis_settings: analysisSettings, users: users };
    } catch (error) {
      console.error('Error fetching configuration:', error);
      throw new ConfigurationServiceError('Failed to fetch configuration');
    }
  }

  // Update model configuration
  async updateModelConfiguration(configData: any) {
    try {
      console.log('Updating model configuration');
      const config = await ModelConfiguration.create(configData);
      return config;
    } catch (error) {
      console.error('Error updating model configuration:', error);
      throw new ConfigurationServiceError('Failed to update model configuration');
    }
  }

  // Update analysis settings
  async updateAnalysisSettings(settingsData: any) {
    try {
      console.log('Updating analysis settings');
      const settings = await AnalysisSettings.create(settingsData);
      return settings;
    } catch (error) {
      console.error('Error updating analysis settings:', error);
      throw new ConfigurationServiceError('Failed to update analysis settings');
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      console.log('Fetching all users');
      const users = await User.findAll();
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new ConfigurationServiceError('Failed to fetch users');
    }
  }

  // Create user
  async createUser(userData: any) {
    try {
      console.log('Creating new user');
      const user = await User.create(userData);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new ConfigurationServiceError('Failed to create user');
    }
  }

  // Update user
  async updateUser(userId: string, userData: any) {
    try {
      console.log('Updating user:', userId);
      const user = await User.findByPk(userId);
      if (!user) {
        throw new ConfigurationServiceError('User not found');
      }
      await user.update(userData);
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new ConfigurationServiceError('Failed to update user');
    }
  }

  // Delete user
  async deleteUser(userId: string) {
    try {
      console.log('Deleting user:', userId);
      const user = await User.findByPk(userId);
      if (!user) {
        throw new ConfigurationServiceError('User not found');
      }
      await user.destroy();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new ConfigurationServiceError('Failed to delete user');
    }
  }

  async createKPIMetric(metricData: Omit<KPIMetric, 'id'>) {
    try {
      console.log('Creating KPI metric');
      const metric = await KPIMetric.create(metricData);
      return metric;
    } catch (error) {
      console.error('Error creating KPI metric:', error);
      throw new ConfigurationServiceError('Failed to create KPI metric');
    }
  }

  async updateKPIMetric(id: string, metricData: Partial<Omit<KPIMetric, 'id'>>) {
    try {
      console.log('Updating KPI metric:', id);
      const metric = await KPIMetric.findByPk(id);
      if (!metric) {
        throw new ConfigurationServiceError('KPI metric not found');
      }
      await metric.update(metricData);
      return metric;
    } catch (error) {
      console.error('Error updating KPI metric:', error);
      throw new ConfigurationServiceError('Failed to update KPI metric');
    }
  }

  async deleteKPIMetric(id: string) {
    try {
      console.log('Deleting KPI metric:', id);
      const metric = await KPIMetric.findByPk(id);
      if (!metric) {
        throw new ConfigurationServiceError('KPI metric not found');
      }
      await metric.destroy();
      return { success: true };
    } catch (error) {
      console.error('Error deleting KPI metric:', error);
      throw new ConfigurationServiceError('Failed to delete KPI metric');
    }
  }

  async getAllKPIMetrics() {
    try {
      console.log('Fetching all KPI metrics');
      const metrics = await KPIMetric.findAll({
        order: [['createdAt', 'ASC']]
      });
      return metrics;
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      throw new ConfigurationServiceError('Failed to fetch KPI metrics');
    }
  }
} 