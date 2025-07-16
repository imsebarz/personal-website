/**
 * Validadores para webhooks de Todoist
 */

import crypto from 'crypto';
import { TodoistWebhookPayload } from '@/types/notion-todoist';

/**
 * Valida si un webhook de Todoist es válido usando HMAC
 */
export function isValidTodoistWebhook(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Todoist envía la firma en formato: SHA256=<hash>
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');

    // La firma viene como "UEEq9si3Vf9yRSrLthbpazbb69kP9+CZQ7fXmVyjhPs="
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error validating Todoist webhook signature:', error);
    return false;
  }
}

/**
 * Determina si el evento de Todoist debe ser procesado
 */
export function shouldProcessTodoistEvent(payload: TodoistWebhookPayload): boolean {
  // Solo procesar eventos de items completados y no completados
  if (payload.event_name !== 'item:completed' && payload.event_name !== 'item:uncompleted') {
    return false;
  }

  // Verificar que el evento tenga los datos necesarios
  if (!payload.event_data || !payload.event_data.id || !payload.event_data.description) {
    return false;
  }

  // Verificar que la tarea tenga una referencia a Notion en la descripción
  const description = payload.event_data.description;
  const hasNotionReference = description.includes('notion.so/') || 
                           description.includes('www.notion.so/') ||
                           description.includes('notion.com/');

  return hasNotionReference;
}

/**
 * Extrae el ID de página de Notion de la descripción de la tarea de Todoist
 */
export function extractNotionPageId(description: string): string | null {
  try {
    // Buscar patrones de URL de Notion
    const patterns = [
      // Patrones directos con ID
      /notion\.so\/([a-f0-9]{32})/i,
      /notion\.so\/([a-f0-9-]{36})/i,
      /www\.notion\.so\/([a-f0-9]{32})/i,
      /www\.notion\.so\/([a-f0-9-]{36})/i,
      /notion\.com\/([a-f0-9]{32})/i,
      /notion\.com\/([a-f0-9-]{36})/i,
      
      // Patrones con título de página seguido de ID
      /notion\.so\/[^\/\s]*-([a-f0-9]{32})/i,
      /notion\.so\/[^\/\s]*-([a-f0-9-]{36})/i,
      /www\.notion\.so\/[^\/\s]*-([a-f0-9]{32})/i,
      /www\.notion\.so\/[^\/\s]*-([a-f0-9-]{36})/i,
      /notion\.com\/[^\/\s]*-([a-f0-9]{32})/i,
      /notion\.com\/[^\/\s]*-([a-f0-9-]{36})/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        let pageId = match[1];
        
        // Si el ID no tiene guiones, agregarlos en el formato correcto
        if (pageId.length === 32 && !pageId.includes('-')) {
          pageId = [
            pageId.slice(0, 8),
            pageId.slice(8, 12),
            pageId.slice(12, 16),
            pageId.slice(16, 20),
            pageId.slice(20)
          ].join('-');
        }
        
        return pageId;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting Notion page ID from description:', error);
    return null;
  }
}

/**
 * Valida la estructura básica del payload de Todoist
 */
export function isValidTodoistPayload(payload: unknown): payload is TodoistWebhookPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const obj = payload as Record<string, unknown>;
  
  return Boolean(
    typeof obj.event_name === 'string' &&
    typeof obj.user_id === 'string' &&
    obj.event_data &&
    typeof obj.event_data === 'object' &&
    typeof obj.triggered_at === 'string'
  );
}

/**
 * Obtiene el estado de completado apropiado para Notion
 */
export function getCompletedStatusForNotion(): string {
  // Puedes configurar esto según los estados que uses en tu Notion
  return 'Completado';
}

/**
 * Obtiene el estado de no completado apropiado para Notion
 */
export function getUncompletedStatusForNotion(): string {
  // Estados comunes para tareas pendientes/en progreso
  return 'En progreso';
}
