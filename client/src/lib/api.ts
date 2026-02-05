import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface ImportLog {
  _id: string;
  fileName: string;
  source: string;
  timestamp: string;
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: number;
  failedReasons: Array<{
    jobId: string;
    reason: string;
    error: string;
  }>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingTime?: number;
}

export interface ImportHistoryResponse {
  success: boolean;
  data: ImportLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StatsResponse {
  success: boolean;
  data: {
    totalImports: number;
    totalFetched: number;
    totalImported: number;
    totalNew: number;
    totalUpdated: number;
    totalFailed: number;
  };
}

export const importHistoryApi = {
  getHistory: async (
    page = 1,
    limit = 20,
    filters?: { source?: string; status?: string; startDate?: string; endDate?: string }
  ): Promise<ImportHistoryResponse> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters?.source && { source: filters.source }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
    });
    const res = await api.get(`/import-history?${params.toString()}`);
    return res.data;
  },

  getStats: async (): Promise<StatsResponse> => {
    const res = await api.get('/import-history/stats/summary');
    return res.data;
  },

  triggerFetch: async () => {
    const res = await api.post('/trigger-fetch');
    return res.data;
  },
};


