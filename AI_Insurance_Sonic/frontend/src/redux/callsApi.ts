import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../services/api';

export interface Call {
  id: string;
  date: string;
  time: string;
  agent: string;
  customer: string;
  duration: string;
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  issues: number | 'None';
  kpiScore: string;
  transcription?: string;
  audioUrl?: string;
}

export interface GetCallsResponse {
  calls: Call[];
  total: number;
  page: number;
  limit: number;
}

export interface GetCallsRequest {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  agent?: string;
  category?: string;
  sentiment?: string;
}

export interface CallDetails {
  id: string;
  date: string;
  time: string;
  agent: string;
  customer: string;
  duration: string;
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  kpiScore: string;
  isCompliant: boolean;
  transcript: {
    time: string;
    speaker: 'Agent' | 'Customer';
    text: string;
  }[];
  keyMetrics: {
    date: string;
    time: string;
    duration: string;
    category: string;
    agent: string;
    customer: string;
  };
  kpiMetrics: {
    greeting: number;
    identityVerification: number;
    problemUnderstanding: number;
    solutionOffering: number;
    empathy: number;
    requiredDisclosures: number;
    closing: number;
  };
  keyPhrases: string[];
  sentimentAnalysis: {
    positive: number;
    negative?: number;
    neutral?: number;
  };
  topicsDiscussed: {
    topic: string;
    percentage: number;
  }[];
  emotional: {
    satisfaction: number;
    frustration: number;
    confidence: number;
    confusion: number;
  };
}

export const callsApi = createApi({
  reducerPath: 'callsApi',
  baseQuery: baseQuery,
  endpoints: (builder) => ({
    getCalls: builder.query<GetCallsResponse, GetCallsRequest>({
      query: (params) => ({
        url: '/calls',
        method: 'GET',
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          startDate: params.startDate,
          endDate: params.endDate,
          agent: params.agent,
          category: params.category,
          sentiment: params.sentiment
        }
      }),
      transformResponse: (response: GetCallsResponse) => ({
        ...response,
        calls: response.calls.map(call => ({
          ...call,
          kpiScore: `${call.kpiScore}%`
        }))
      })
    }),
    getCallById: builder.query<CallDetails, string>({
      query: (id) => ({
        url: `/calls/${id}`,
        method: 'GET'
      }),
      transformResponse: (response: CallDetails) => ({
        ...response,
        kpiScore: `${response.kpiScore}%`
      })
    })
  }),
  refetchOnMountOrArgChange: true,
});

export const {
  useGetCallsQuery,
  useGetCallByIdQuery,
} = callsApi; 