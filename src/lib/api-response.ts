/**
 * Tipos de respuesta estandarizados para APIs
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    duration?: number;
  };
}

export interface WebhookResponse {
  message: string;
  pageId?: string;
  eventAction?: 'create' | 'update' | 'skip';
  debounceTimeMs?: number;
  success?: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: string;
  version?: string;
  uptime?: number;
  endpoints?: Record<string, string>;
  features?: Record<string, boolean | string>;
  configuration?: Record<string, boolean>;
}

// Utility functions para crear respuestas consistentes
export function createSuccessResponse<T>(
  data: T, 
  meta?: Partial<ApiResponse['meta']>
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function createErrorResponse(
  message: string,
  code?: string,
  details?: unknown,
  meta?: Partial<ApiResponse['meta']>
): ApiResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function createWebhookResponse(
  message: string,
  options: Partial<WebhookResponse> = {}
): WebhookResponse {
  return {
    message,
    success: true,
    ...options,
  };
}
