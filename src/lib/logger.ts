/**
 * Logger centralizado para la aplicación
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const emoji = this.getEmoji(level);
    const contextStr = context ? ` ${JSON.stringify(context, null, 2)}` : '';
    
    return `[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      })
    };
    
    console.error(this.formatMessage('error', message, errorContext));
  }

  // Métodos específicos para webhooks
  webhookReceived(payload: unknown, requestId?: string): void {
    this.info('Webhook received', { 
      requestId,
      payloadType: typeof payload,
      hasPayload: !!payload 
    });
  }

  webhookProcessed(pageId: string, action: string, requestId?: string): void {
    this.info('Webhook processed successfully', { 
      pageId, 
      action,
      requestId 
    });
  }

  webhookError(error: Error, pageId?: string, requestId?: string): void {
    this.error('Webhook processing failed', error, { 
      pageId,
      requestId 
    });
  }
}

// Singleton instance
export const logger = new Logger();
