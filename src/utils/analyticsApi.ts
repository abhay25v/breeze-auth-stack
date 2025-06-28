import { UserAnalytics } from '@/hooks/useUserAnalytics';

export interface AnalyticsApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export class AnalyticsApi {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async sendSingleAnalytics(data: UserAnalytics): Promise<AnalyticsApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      return {
        success: response.ok,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      console.error('Error sending analytics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendBatchAnalytics(dataArray: UserAnalytics[]): Promise<AnalyticsApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/batch`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ analytics: dataArray }),
      });

      const result = await response.json();

      return {
        success: response.ok,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      console.error('Error sending batch analytics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAnalytics(sessionId?: string, startDate?: Date, endDate?: Date): Promise<AnalyticsApiResponse> {
    try {
      const params = new URLSearchParams();
      
      if (sessionId) params.append('sessionId', sessionId);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const url = `${this.baseUrl}/analytics${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();

      return {
        success: response.ok,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteAnalytics(sessionId: string): Promise<AnalyticsApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/${sessionId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const result = await response.json();

      return {
        success: response.ok,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      console.error('Error deleting analytics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Default instance
export const createAnalyticsApi = (baseUrl: string, apiKey?: string) => {
  return new AnalyticsApi(baseUrl, apiKey);
};
