/**
 * API Route para webhooks de Notion
 * Refactorizada para mejor arquitectura y mantenibilidad
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { createSuccessResponse, createWebhookResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { validateEnvironment } from '@/lib/config';
import { NotionWebhookService } from '@/services/webhooks/notion-webhook.service';
import { HealthCheckService } from '@/services/health-check.service';

// Validar configuración al inicio
validateEnvironment();

// Servicios
const webhookService = new NotionWebhookService();
const healthService = new HealthCheckService();

/**
 * POST - Procesar webhook de Notion
 */
const handlePost = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  // Extraer payload y headers
  const payload = await request.json();
  const headers = {
    'notion-version': request.headers.get('notion-version'),
    'user-agent': request.headers.get('user-agent'),
    'content-type': request.headers.get('content-type'),
    'x-notion-signature': request.headers.get('x-notion-signature'),
  };

  logger.info('Processing webhook request', { 
    hasPayload: !!payload,
    userAgent: headers['user-agent'],
    hasSignature: !!headers['x-notion-signature']
  });

  // Procesar webhook
  const result = await webhookService.processWebhook(payload, headers);
  
  // Si es verificación, retornar formato especial
  if ('verification_token' in result) {
    return NextResponse.json({
      verification_token: result.verification_token
    });
  }

  // Retornar respuesta estándar
  const response = createWebhookResponse(result.message, {
    pageId: result.pageId,
    eventAction: result.eventAction,
    debounceTimeMs: result.debounceTimeMs,
  });

  return NextResponse.json(response);
});

/**
 * GET - Health check
 */
const handleGet = withErrorHandler(async (): Promise<NextResponse> => {
  const healthStatus = healthService.getHealthStatus();
  const stats = webhookService.getStats();
  
  const response = createSuccessResponse({
    ...healthStatus,
    stats,
  });

  return NextResponse.json(response);
});

// Exportar handlers
export const POST = handlePost;
export const GET = handleGet;
