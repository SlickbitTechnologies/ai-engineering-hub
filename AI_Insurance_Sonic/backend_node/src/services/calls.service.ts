import { Op } from 'sequelize';
import ConversationAnalysis from '../db/models/ConversationAnalysis';
import Transcription from '../db/models/Transcription';
import AudioFile from '../db/models/AudioFile';
import ConversationTurn from '../db/models/ConversationTurn';
import { CallServiceError } from '../utils/errors';

interface GetCallsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  agent?: string;
  categories?: string[];
  sentiments?: string[];
  kpiScore?: string;
}

interface Topic {
  topic: string;
  mentions: number;
}

interface SentimentScores {
  positive: number;
  negative: number;
  neutral: number;
  topicsDiscussed?: Topic[];
}

interface CallResponse {
  id: string;
  date: string;
  time: string;
  agent: string | null;
  customer: string | null;
  duration: string;
  category: string;
  sentiment: string;
  issues: number | 'None';
  kpiScore: number;
  transcription: string;
  audioUrl: string;
}

export class CallsService {
  async getCalls(params: GetCallsParams) {
    try {
      console.log('Fetching calls with params:', params);
      
      const transcriptionWhere: any = {};
      const analysisWhere: any = {};
      
      // Build where conditions
      if (params.search) {
        const searchTerm = `%${params.search}%`;
        transcriptionWhere[Op.or] = [
          { agentName: { [Op.like]: searchTerm } },
          { customerName: { [Op.like]: searchTerm } },
          { category: { [Op.like]: searchTerm } }
        ];
      }
      const audioFileFilter: any = {};
      // Add date range filtering
      if (params.startDate && params.endDate) {
        // Create start of day for start date and end of day for end date
        const startDate = new Date(params.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(params.endDate);
        endDate.setHours(23, 59, 59, 999);

        audioFileFilter.createdAt = {
          [Op.between]: [startDate, endDate]
        };
      }
      console.log("audioFileFilter",audioFileFilter);
      if (params.agent) {
        transcriptionWhere.agentName = params.agent;
      }

      if (params.categories && params.categories.length > 0) {
        transcriptionWhere.category = { [Op.in]: params.categories };
      }

      if (params.sentiments && params.sentiments.length > 0) {
        analysisWhere.sentiment = { [Op.in]: params.sentiments };
      }
      if (params.kpiScore) {
        console.log("params.kpiScore", params.kpiScore);
        const [min] = params.kpiScore.split('-').map(Number);
        analysisWhere.kpiScore = { [Op.gte]: min };
      }

      // Build order conditions
      const order: any[] = [];
      if (params.sortBy) {
        const column = this.getSortColumn(params.sortBy);
        order.push([...column.split('.'), params.sortOrder || 'ASC']);
      } else {
        order.push(['createdAt', 'DESC']);
      }

      // Get total count and data
      const { count, rows } = await AudioFile.findAndCountAll({
        attributes: ['id', 'duration', 'url', 'createdAt'],
        where: audioFileFilter,
        include: [
          {
            model: Transcription,
            as: 'Transcription',
            required: true,
            where: transcriptionWhere,
            attributes: ['agentName', 'customerName', 'category', 'text'],
            include: [
              {
                model: ConversationAnalysis,
                as: 'Analysis',
                required: true,
                where: analysisWhere,
                attributes: ['sentiment', 'kpiScore']
              },
              {
                model: ConversationTurn,
                as: 'ConversationTurns',
                attributes: ['sentiment'],
                where: { sentiment: 'Negative' },
                required: false
              }
            ]
          }
        ],
        offset: (params.page - 1) * params.limit,
        limit: params.limit,
        order,
        distinct: true
      });

      return {
        calls: rows.map((audioFile) => this.formatCall(audioFile as AudioFile & { 
          Transcription: Transcription & { 
            Analysis: ConversationAnalysis,
            ConversationTurns: ConversationTurn[] 
          }
        })),
        total: count,
        page: params.page,
        limit: params.limit
      };
    } catch (error) {
      console.error('Error fetching calls:', error);
      throw new CallServiceError('Failed to fetch calls');
    }
  }

  private formatCall(audioFile: AudioFile & { 
    Transcription: Transcription & { 
      Analysis: ConversationAnalysis,
      ConversationTurns: ConversationTurn[] 
    }
  }): CallResponse {
    const date = new Date(audioFile.createdAt);
    return {
      id: audioFile.id,
      date: date.toISOString().split('T')[0],
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      agent: audioFile.Transcription.agentName,
      customer: audioFile.Transcription.customerName,
      duration: this.formatDuration(audioFile.duration),
      category: audioFile.Transcription.category,
      sentiment: audioFile.Transcription.Analysis.sentiment,
      issues: audioFile.Transcription.ConversationTurns.length || 'None',
      kpiScore: Math.round(audioFile.Transcription.Analysis.kpiScore),
      transcription: audioFile.Transcription.text,
      audioUrl: audioFile.url
    };
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private getSortColumn(sortBy: string): string {
    const columnMap: { [key: string]: string } = {
      date: 'createdAt',
      agent: 'Transcription.agentName',
      customer: 'Transcription.customerName',
      duration: 'duration',
      category: 'Transcription.category',
      sentiment: 'Transcription.Analysis.sentiment',
      issues: 'Transcription.ConversationTurns.length',
      kpiScore: 'Transcription.Analysis.kpiScore'
    };
    return columnMap[sortBy] || 'createdAt';
  }

  async getCallById(id: string) {
    try {
      const audioFile = await AudioFile.findByPk(id, {
        include: [
          {
            model: Transcription,
            as: 'Transcription',

            required: true,
            include: [
              {
                model: ConversationAnalysis,
                as: 'Analysis',
                required: true
              },
              {
                model: ConversationTurn,
                as: 'ConversationTurns',
                required: true,
                order: [['sequence', 'ASC']]
              }
            ]
          }
        ]
      }) as unknown as AudioFile & { 
        Transcription: Transcription & { 
          Analysis: ConversationAnalysis,
          ConversationTurns: ConversationTurn[] 
        }
      };
     
      if (!audioFile) {
        throw new CallServiceError('Call not found');
      }
     
      // Format the response to match the frontend interface
      const transcription = audioFile.Transcription;
      const analysis = transcription.Analysis;
      let turns = transcription.ConversationTurns;
      turns = turns.sort((a, b) => a.sequence - b.sequence);
      console.log("turns",turns );
    const matrics = {
        id: audioFile.id,
        url: audioFile.url,
        date: new Date(audioFile.createdAt).toISOString().split('T')[0],
        time: new Date(audioFile.createdAt).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
        agent: transcription.agentName,
        customer: transcription.customerName,
        duration: this.formatDuration(audioFile.duration),
        category: transcription.category,
        sentiment: analysis.sentiment as 'Positive' | 'Neutral' | 'Negative',
        sentimentScores: analysis.sentimentScores,
        emotional: analysis.emotional,
        kpiMetrics: analysis.kpiMetrics,
        kpiScore: analysis.kpiScore,
        kpiAnalysis: analysis.kpiAnalysis,
        isCompliant: analysis.kpiScore >= 80,
        transcript: turns.map((turn: ConversationTurn) => ({
          
          speaker: turn.speaker,
          text: turn.content
        })),
        keyMetrics: {
          date: new Date(audioFile.createdAt).toISOString().split('T')[0],
          time: new Date(audioFile.createdAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
          duration: this.formatDuration(audioFile.duration),
          category: transcription.category,
          agent: transcription.agentName,
          customer: transcription.customerName
        },
        keyPhrases: (analysis.sentimentScores as SentimentScores).topicsDiscussed?.map((topic: Topic) => topic.topic) || [],
        sentimentAnalysis: {
          positive: analysis.sentimentScores.positive,
          neutral: analysis.sentimentScores.neutral,
          negative: analysis.sentimentScores.negative
        },
        topicsDiscussed: (analysis.sentimentScores as SentimentScores).topicsDiscussed?.map((topic: Topic) => ({
          topic: topic.topic,
          percentage: topic.mentions * 10 // Convert mentions to percentage
        })) || []
      }
      console.log(matrics);
      return matrics;
    } catch (error) {
      console.error('Error fetching call details:', error);
      throw error;
    }
  }
} 