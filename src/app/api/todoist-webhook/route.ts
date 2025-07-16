/**
 * API Route para webhooks de Todoist
 * Maneja eventos de completado de tareas que deben sincronizarse con Notion
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { logger } from '@/lib/logger';
import { validateEnvironment } from '@/lib/config';
import { TodoistWebhookService } from '@/services/webhooks/todoist-webhook.service';
import { HealthCheckService } from '@/services/health-check.service';

// Validar configuración al inicio
validateEnvironment();

// Servicios
const webhookService = new TodoistWebhookService();
const healthService = new HealthCheckService();

/**
 * POST - Procesar webhook de Todoist
 */
const handlePost = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  // Extraer raw body para validación de signature
  const rawBody = await request.text();
  let payload;
  
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    logger.error('Failed to parse JSON payload', error as Error);
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  // Extraer headers relevantes
  const headers = {
    'content-type': request.headers.get('content-type'),
    'user-agent': request.headers.get('user-agent'),
    'x-todoist-hmac-sha256': request.headers.get('x-todoist-hmac-sha256'),
    'x-todoist-delivery-id': request.headers.get('x-todoist-delivery-id'),
  };

  logger.info('Processing Todoist webhook request', { 
    hasPayload: !!payload,
    userAgent: headers['user-agent'],
    hasSignature: !!headers['x-todoist-hmac-sha256'],
    deliveryId: headers['x-todoist-delivery-id'],
    eventName: payload?.event_name
  });

  // Procesar webhook
  const result = await webhookService.processWebhook(payload, headers, rawBody);
  
  // Retornar respuesta exitosa (HTTP 200 requerido por Todoist)
  return NextResponse.json({
    success: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * GET - Health check
 */
const handleGet = withErrorHandler(async (): Promise<NextResponse> => {
  const health = healthService.getHealthStatus();
  return NextResponse.json({
    ...health,
    endpoint: 'todoist-webhook',
    message: 'Todoist-Notion Webhook API is running'
  });
});

export { handlePost as POST, handleGet as GET };
