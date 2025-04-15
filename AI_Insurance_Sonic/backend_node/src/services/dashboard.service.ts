import { QueryTypes } from 'sequelize';
import AudioFile from '../db/models/AudioFile';
import Transcription from '../db/models/Transcription';
import ConversationAnalysis from '../db/models/ConversationAnalysis';
import ConversationTurn from '../db/models/ConversationTurn';
import sequelize from '../db/config';
import { DashboardServiceError } from '../utils/errors';

interface DashboardMetrics {
  totalCalls: number;
  averageDuration: string;
  kpiComplianceRate: number;
  complianceIssues: number;
  trends: {
    totalCalls: string;
    averageDuration: string;
    kpiComplianceRate: string;
    complianceIssues: string;
  };
}

interface TrendData {
  labels: string[];
  data: number[];
}

interface DatasetTrend {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

interface MetricsResult {
  totalCalls: number;
  avgDuration: number;
  avgKpiScore: number;
  issues: number;
}

interface TrendResult {
  date: string;
  value: number;
  category?: string;
  sentiment?: string;
}

interface RecentCall {
  id: string;
  date: string;
  time: string;
  fileName: string;
  duration: string;
  category: string;
  agentName: string | null;
  customerName: string | null;
  sentiment: string;
  kpiScore: number;
  customerMood: string;
}

export class DashboardService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      console.log('Fetching dashboard metrics');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const [current, previous] = await Promise.all([
        sequelize.query<MetricsResult>(`
          SELECT 
            COUNT(DISTINCT af.id) as totalCalls,
            COALESCE(AVG(af.duration), 0) as avgDuration,
            COALESCE(AVG(ca.kpiScore), 0) as avgKpiScore,
            COUNT(CASE WHEN ca.kpiScore < 80 THEN 1 END) as issues
          FROM audio_files af
          INNER JOIN transcriptions t ON t.audioFileId = af.id
          INNER JOIN conversation_analyses ca ON ca.transcriptionId = t.id
          WHERE af.createdAt >= :startDate
        `, {
          replacements: { startDate: thirtyDaysAgo },
          type: QueryTypes.SELECT
        }),
        sequelize.query<MetricsResult>(`
          SELECT 
            COUNT(DISTINCT af.id) as totalCalls,
            COALESCE(AVG(af.duration), 0) as avgDuration,
            COALESCE(AVG(ca.kpiScore), 0) as avgKpiScore,
            COUNT(CASE WHEN ca.kpiScore < 80 THEN 1 END) as issues
          FROM audio_files af
          INNER JOIN transcriptions t ON t.audioFileId = af.id
          INNER JOIN conversation_analyses ca ON ca.transcriptionId = t.id
          WHERE af.createdAt BETWEEN :startDate AND :endDate
        `, {
          replacements: { startDate: sixtyDaysAgo, endDate: thirtyDaysAgo },
          type: QueryTypes.SELECT
        })
      ]);

      const currentMetrics = current[0] || {
        totalCalls: 0,
        avgDuration: 0,
        avgKpiScore: 0,
        issues: 0
      };

      const previousMetrics = previous[0] || {
        totalCalls: 0,
        avgDuration: 0,
        avgKpiScore: 0,
        issues: 0
      };

      return {
        totalCalls: currentMetrics.totalCalls || 0,
        averageDuration: this.formatDuration(currentMetrics.avgDuration || 0),
        kpiComplianceRate: Number(currentMetrics.avgKpiScore || 0),
        complianceIssues: currentMetrics.issues || 0,
        trends: {
          totalCalls: this.calculateTrend(currentMetrics.totalCalls || 0, previousMetrics.totalCalls || 0),
          averageDuration: this.calculateTrend(currentMetrics.avgDuration || 0, previousMetrics.avgDuration || 0),
          kpiComplianceRate: this.calculateTrend(currentMetrics.avgKpiScore || 0, previousMetrics.avgKpiScore || 0),
          complianceIssues: this.calculateTrend(currentMetrics.issues || 0, previousMetrics.issues || 0)
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw new DashboardServiceError('Failed to fetch dashboard metrics');
    }
  }

  async getCallVolumeTrend(timeframe: string): Promise<TrendData> {
    try {
      console.log('Fetching call volume trend for timeframe:', timeframe);
      const startDate = this.getStartDate(timeframe);
      const result = await sequelize.query<TrendResult>(`
        SELECT 
          date(af.createdAt) as date,
          COUNT(DISTINCT af.id) as value
        FROM audio_files af
        WHERE af.createdAt >= :startDate
        GROUP BY date(af.createdAt)
        ORDER BY date ASC
      `, {
        replacements: { startDate },
        type: QueryTypes.SELECT
      });
      console.log('Call volume trend result:', result);
      return {
        labels: result.map(r => r.date),
        data: result.map(r => r.value)
      };
    } catch (error) {
      console.error('Error fetching call volume trend:', error);
      throw new DashboardServiceError('Failed to fetch call volume trend');
    }
  }

  async getKpiPerformance(timeframe: string): Promise<DatasetTrend> {
    try {
      console.log('Fetching KPI performance for timeframe:', timeframe);
      const startDate = this.getStartDate(timeframe);
      const result = await sequelize.query<TrendResult>(`
        SELECT 
          date(af.createdAt) as date,
          t.category,
          AVG(ca.kpiScore) as value
        FROM audio_files af
        INNER JOIN transcriptions t ON t.audioFileId = af.id
        INNER JOIN conversation_analyses ca ON ca.transcriptionId = t.id
        WHERE af.createdAt >= :startDate
        GROUP BY date(af.createdAt), t.category
        ORDER BY date ASC
      `, {
        replacements: { startDate },
        type: QueryTypes.SELECT
      });

      const dateGroups = this.groupByDate(result);
      const categories = ['compliance', 'sales', 'service'];

      return {
        labels: Object.keys(dateGroups),
        datasets: categories.map(category => ({
          label: category.charAt(0).toUpperCase() + category.slice(1),
          data: Object.values(dateGroups).map(dayData => 
            dayData.find(d => d.category === category)?.value || 0
          )
        }))
      };
    } catch (error) {
      console.error('Error fetching KPI performance:', error);
      throw new DashboardServiceError('Failed to fetch KPI performance');
    }
  }

  async getSentimentTrend(timeframe: string): Promise<DatasetTrend> {
    try {
      console.log('Fetching sentiment trend for timeframe:', timeframe);
      const startDate = this.getStartDate(timeframe);
      const result = await sequelize.query<TrendResult>(`
        SELECT 
          date(af.createdAt) as date,
          ca.sentiment,
          COUNT(DISTINCT af.id) as value
        FROM audio_files af
        INNER JOIN transcriptions t ON t.audioFileId = af.id
        INNER JOIN conversation_analyses ca ON ca.transcriptionId = t.id
        WHERE af.createdAt >= :startDate
        GROUP BY date(af.createdAt), ca.sentiment
        ORDER BY date ASC
      `, {
        replacements: { startDate },
        type: QueryTypes.SELECT
      });

      const dateGroups = this.groupByDate(result);
      const sentiments = ['positive', 'neutral', 'negative'];

      return {
        labels: Object.keys(dateGroups),
        datasets: sentiments.map(sentiment => ({
          label: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
          data: Object.values(dateGroups).map(dayData => 
            dayData.find(d => d.sentiment === sentiment)?.value || 0
          )
        }))
      };
    } catch (error) {
      console.error('Error fetching sentiment trend:', error);
      throw new DashboardServiceError('Failed to fetch sentiment trend');
    }
  }

  async getRecentCalls(limit: number): Promise<RecentCall[]> {
    try {
      console.log('Fetching recent calls with limit:', limit);
      const result = await sequelize.query(`
        SELECT 
          af.id,
          af.fileName,
          af.createdAt,
          af.duration,
          t.category,
          t.agentName,
          t.customerName,
          ca.sentiment,
          ca.kpiScore,
          ca.customerMood
        FROM audio_files af
        INNER JOIN transcriptions t ON t.audioFileId = af.id
        INNER JOIN conversation_analyses ca ON ca.transcriptionId = t.id
        ORDER BY af.createdAt DESC
        LIMIT :limit
      `, {
        replacements: { limit },
        type: QueryTypes.SELECT
      });

      return result.map((call: any) => {
        const date = new Date(call.createdAt);
        return {
          id: call.id,
          date: date.toISOString().split('T')[0],
          time: date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
          fileName: call.fileName,
          duration: this.formatDuration(call.duration),
          category: call.category,
          agentName: call.agentName,
          customerName: call.customerName,
          sentiment: call.sentiment,
          kpiScore: call.kpiScore,
          customerMood: call.customerMood
        };
      });
    } catch (error) {
      console.error('Error fetching recent calls:', error);
      throw new DashboardServiceError('Failed to fetch recent calls');
    }
  }

  private getStartDate(timeframe: string): Date {
    const date = new Date();
    switch (timeframe) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
      default:
        date.setDate(date.getDate() - 7);
    }
    return date;
  }

  private formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private calculateTrend(current: number, previous: number): string {
    if (!previous || previous === 0) {
      return current > 0 ? '+100%' : '0%';
    }
    const diff = ((current - previous) / previous) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  }

  private groupByDate(results: TrendResult[]): { [key: string]: TrendResult[] } {
    return results.reduce((acc, curr) => {
      if (!acc[curr.date]) {
        acc[curr.date] = [];
      }
      acc[curr.date].push(curr);
      return acc;
    }, {} as { [key: string]: TrendResult[] });
  }
} 