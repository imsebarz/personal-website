import { NextRequest } from 'next/server';
import { NotionWebhookPayload } from '@/types/notion-todoist';

export interface WebhookLogEntry {
  timestamp: string;
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  payload: NotionWebhookPayload | Record<string, unknown>;
  userAgent: string | null;
  contentType: string | null;
  notionSignature: string | null;
  notionVersion: string | null;
  ipAddress?: string;
  processing: {
    success: boolean;
    duration: number;
    error?: string;
    pageId?: string;
    eventType?: string;
    wasProcessed?: boolean;
    skipReason?: string;
  };
}

class WebhookLogger {
  private logs: WebhookLogEntry[] = [];
  private maxLogs = 1000; // Mantener solo los últimos 1000 logs

  async logRequest(
    request: NextRequest, 
    payload: NotionWebhookPayload | Record<string, unknown>, 
    processing?: Partial<WebhookLogEntry['processing']>
  ): Promise<string> {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();

    // Extraer headers importantes
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const logEntry: WebhookLogEntry = {
      timestamp,
      requestId,
      method: request.method,
      url: request.url,
      headers,
      payload,
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
      notionSignature: request.headers.get('x-notion-signature'),
      notionVersion: request.headers.get('notion-version'),
      ipAddress: this.getClientIp(request),
      processing: {
        success: false,
        duration: 0,
        ...processing
      }
    };

    this.addLog(logEntry);

    return requestId;
  }

  updateProcessingResult(requestId: string, processing: Partial<WebhookLogEntry['processing']>) {
    const logIndex = this.logs.findIndex(log => log.requestId === requestId);
    if (logIndex !== -1) {
      this.logs[logIndex].processing = {
        ...this.logs[logIndex].processing,
        ...processing
      };
    }
  }

  private addLog(entry: WebhookLogEntry) {
    this.logs.push(entry);
    
    // Mantener solo los últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIp(request: NextRequest): string | undefined {
    // Intentar obtener la IP real del cliente
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }

    return undefined;
  }

  // Métodos para consultar logs
  getAllLogs(): WebhookLogEntry[] {
    return [...this.logs].reverse(); // Más recientes primero
  }

  getLogsByTimeRange(startTime: Date, endTime: Date): WebhookLogEntry[] {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  getLogsByEventType(eventType: string): WebhookLogEntry[] {
    return this.logs.filter(log => 
      log.payload?.type === eventType
    );
  }

  getFailedLogs(): WebhookLogEntry[] {
    return this.logs.filter(log => !log.processing.success);
  }

  getSuccessfulLogs(): WebhookLogEntry[] {
    return this.logs.filter(log => log.processing.success);
  }

  getLogById(requestId: string): WebhookLogEntry | undefined {
    return this.logs.find(log => log.requestId === requestId);
  }

  // Estadísticas
  getStats() {
    const total = this.logs.length;
    const successful = this.getSuccessfulLogs().length;
    const failed = this.getFailedLogs().length;
    
    const eventTypes = new Map<string, number>();
    const userAgents = new Map<string, number>();
    
    this.logs.forEach(log => {
      const eventType = (log.payload as NotionWebhookPayload)?.type || 'unknown';
      eventTypes.set(eventType, (eventTypes.get(eventType) || 0) + 1);
      
      const userAgent = log.userAgent || 'unknown';
      userAgents.set(userAgent, (userAgents.get(userAgent) || 0) + 1);
    });

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) + '%' : '0%',
      eventTypes: Object.fromEntries(eventTypes),
      userAgents: Object.fromEntries(userAgents),
      averageProcessingTime: this.calculateAverageProcessingTime()
    };
  }

  private calculateAverageProcessingTime(): number {
    const processedLogs = this.logs.filter(log => log.processing.duration > 0);
    if (processedLogs.length === 0) return 0;
    
    const totalTime = processedLogs.reduce((sum, log) => sum + log.processing.duration, 0);
    return Math.round(totalTime / processedLogs.length);
  }

  // Exportar logs para análisis
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCsv();
    }
    return JSON.stringify(this.logs, null, 2);
  }

  private exportToCsv(): string {
    const headers = [
      'timestamp', 'requestId', 'method', 'eventType', 'pageId', 
      'success', 'duration', 'userAgent', 'notionVersion', 'error'
    ];
    
    const rows = this.logs.map(log => [
      log.timestamp,
      log.requestId,
      log.method,
      (log.payload as NotionWebhookPayload)?.type || '',
      (log.payload as NotionWebhookPayload)?.entity?.id || 
      (log.payload as NotionWebhookPayload)?.page?.id || '',
      log.processing.success.toString(),
      log.processing.duration.toString(),
      log.userAgent || '',
      log.notionVersion || '',
      log.processing.error || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Limpiar logs antiguos
  clearOldLogs(olderThanHours: number = 24) {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    const initialCount = this.logs.length;
    
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp) > cutoffTime
    );
    
    const removedCount = initialCount - this.logs.length;
    
    return removedCount;
  }
}

// Singleton para mantener logs en memoria durante la sesión
export const webhookLogger = new WebhookLogger();

// Utilidades para logging específico
export function logWebhookStart(request: NextRequest, payload: NotionWebhookPayload | Record<string, unknown>): Promise<string> {
  return webhookLogger.logRequest(request, payload);
}

export function logWebhookSuccess(requestId: string, duration: number, pageId?: string, eventType?: string) {
  webhookLogger.updateProcessingResult(requestId, {
    success: true,
    duration,
    pageId,
    eventType,
    wasProcessed: true
  });
}

export function logWebhookSkipped(requestId: string, duration: number, skipReason: string, pageId?: string, eventType?: string) {
  webhookLogger.updateProcessingResult(requestId, {
    success: true,
    duration,
    pageId,
    eventType,
    wasProcessed: false,
    skipReason
  });
}

export function logWebhookError(requestId: string, duration: number, error: string, pageId?: string, eventType?: string) {
  webhookLogger.updateProcessingResult(requestId, {
    success: false,
    duration,
    error,
    pageId,
    eventType,
    wasProcessed: false
  });
}
