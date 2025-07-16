/**
 * Middleware para manejo de errores en APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-response';

export type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  includeStack?: boolean;
}

/**
 * Wrapper para manejar errores de forma consistente en las rutas de API
 */
export function withErrorHandler(
  handler: ApiHandler,
  options: ErrorHandlerOptions = {}
): ApiHandler {
  const { logErrors = true, includeStack = false } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    try {
      // Log incoming request
      if (logErrors) {
        logger.info('API request received', {
          requestId,
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
        });
      }

      const response = await handler(request);
      
      // Log successful response
      if (logErrors) {
        const duration = Date.now() - startTime;
        logger.info('API request completed', {
          requestId,
          status: response.status,
          duration,
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (logErrors) {
        logger.error('API request failed', error, {
          requestId,
          method: request.method,
          url: request.url,
          duration,
        });
      }

      // Determine error status and message
      const { status, message, code } = getErrorDetails(error);
      
      const errorResponse = createErrorResponse(
        message,
        code,
        includeStack && error instanceof Error ? error.stack : undefined,
        { requestId, duration }
      );

      return NextResponse.json(errorResponse, { status });
    }
  };
}

/**
 * Extrae detalles del error para crear una respuesta apropiada
 */
function getErrorDetails(error: unknown): {
  status: number;
  message: string;
  code?: string;
} {
  if (error instanceof Error) {
    // Custom error types
    if (error.name === 'ValidationError') {
      return { status: 400, message: error.message, code: 'VALIDATION_ERROR' };
    }
    
    if (error.name === 'NotFoundError') {
      return { status: 404, message: error.message, code: 'NOT_FOUND' };
    }
    
    if (error.name === 'UnauthorizedError') {
      return { status: 401, message: error.message, code: 'UNAUTHORIZED' };
    }

    // Generic error
    return { 
      status: 500, 
      message: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR'
    };
  }

  // Unknown error type
  return { 
    status: 500, 
    message: 'Unknown error occurred',
    code: 'UNKNOWN_ERROR'
  };
}

/**
 * Genera un ID único para la request
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
