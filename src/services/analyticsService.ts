import { UserAnalytics } from '@/hooks/useUserAnalytics';

export interface AnalyticsConfig {
  endpoint: string;
  apiKey?: string;
  batchSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class AnalyticsService {
  private config: AnalyticsConfig;
  private queue: UserAnalytics[] = [];
  private isProcessing = false;

  constructor(config: AnalyticsConfig) {
    this.config = {
      batchSize: 10,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  async sendAnalytics(data: UserAnalytics): Promise<boolean> {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send analytics:', error);
      return false;
    }
  }

  async sendBatchAnalytics(dataArray: UserAnalytics[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({ analytics: dataArray })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send batch analytics:', error);
      return false;
    }
  }

  addToQueue(data: UserAnalytics): void {
    this.queue.push(data);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const batchSize = this.config.batchSize!;
      const batch = this.queue.splice(0, Math.min(batchSize, this.queue.length));
      
      let success = false;
      let attempts = 0;

      while (!success && attempts < this.config.retryAttempts!) {
        attempts++;
        
        if (batch.length === 1) {
          success = await this.sendAnalytics(batch[0]);
        } else {
          success = await this.sendBatchAnalytics(batch);
        }

        if (!success && attempts < this.config.retryAttempts!) {
          await this.delay(this.config.retryDelay! * attempts);
        }
      }

      if (!success) {
        // Put failed items back in queue for later retry
        this.queue.unshift(...batch);
      }
    } finally {
      this.isProcessing = false;
      
      // Process remaining queue items
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
  }
}

// Default service instance
let defaultService: AnalyticsService | null = null;

export const initializeAnalytics = (config: AnalyticsConfig): AnalyticsService => {
  defaultService = new AnalyticsService(config);
  return defaultService;
};

export const getAnalyticsService = (): AnalyticsService | null => {
  return defaultService;
};
