/**
 * Servicio para manejar webhooks de Todoist que actualizan Notion
 */

import { TodoistWebhookPayload } from '@/types/notion-todoist';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/middleware/error-handler';
import { 
  isValidTodoistPayload,
  isValidTodoistWebhook,
  shouldProcessTodoistEvent,
  extractNotionPageId,
  getCompletedStatusForNotion,
  getUncompletedStatusForNotion
} from '@/utils/todoist-webhook-validator';
import { updateNotionPageStatus } from '@/utils/notion-client';

export class TodoistWebhookService {
  
  /**
   * Procesa un webhook de Todoist
   */
  async processWebhook(
    payload: TodoistWebhookPayload,
    headers: Record<string, string | null>,
    rawBody: string
  ): Promise<{
    message: string;
    taskId?: string;
    notionPageId?: string;
    eventType?: string;
  }> {
    // 1. Validar estructura del payload
    if (!isValidTodoistPayload(payload)) {
      throw new ValidationError('Invalid Todoist webhook payload structure');
    }

    // 2. Validar autenticidad del webhook
    const signature = headers['x-todoist-hmac-sha256'];
    const secret = process.env.TODOIST_WEBHOOK_SECRET;
    
    if (secret && !isValidTodoistWebhook(rawBody, signature, secret)) {
      throw new ValidationError('Invalid Todoist webhook signature');
    }

    // 3. Verificar si el evento debe ser procesado
    if (!shouldProcessTodoistEvent(payload)) {
      logger.info('Todoist event skipped - not a completion with Notion reference', {
        eventName: payload.event_name,
        taskId: payload.event_data?.id
      });
      
      return {
        message: 'Event skipped - not relevant for Notion sync',
        eventType: payload.event_name,
        taskId: payload.event_data?.id
      };
    }

    // 4. Procesar evento según el tipo
    if (payload.event_name === 'item:completed') {
      return await this.processTaskCompletion(payload);
    } else if (payload.event_name === 'item:uncompleted') {
      return await this.processTaskUncompletion(payload);
    }

    throw new Error(`Unsupported event type: ${payload.event_name}`);
  }

  /**
   * Procesa el completado de una tarea de Todoist
   */
  private async processTaskCompletion(
    payload: TodoistWebhookPayload
  ): Promise<{
    message: string;
    taskId: string;
    notionPageId?: string;
    eventType: string;
  }> {
    const taskData = payload.event_data;
    const taskId = taskData.id;
    const description = taskData.description;

    logger.info('Processing Todoist task completion', {
      taskId,
      taskTitle: taskData.content,
      completedAt: taskData.completed_at,
      userId: payload.user_id
    });

    try {
      // Extraer ID de página de Notion de la descripción
      const notionPageId = extractNotionPageId(description);
      
      if (!notionPageId) {
        logger.warn('No Notion page ID found in task description', {
          taskId,
          description: description.substring(0, 100) + '...'
        });
        
        return {
          message: 'Task completed but no Notion page ID found in description',
          taskId,
          eventType: payload.event_name
        };
      }

      // Actualizar status en Notion
      const completedStatus = getCompletedStatusForNotion();
      await updateNotionPageStatus(notionPageId, completedStatus);

      logger.info('Successfully updated Notion page status', {
        taskId,
        notionPageId,
        newStatus: completedStatus,
        taskTitle: taskData.content
      });

      return {
        message: 'Task completion synced to Notion successfully',
        taskId,
        notionPageId,
        eventType: payload.event_name
      };

    } catch (error) {
      logger.error('Error processing Todoist task completion', error as Error, {
        taskId,
        taskTitle: taskData.content,
        description: description.substring(0, 100) + '...'
      });

      throw new Error(`Failed to sync task completion to Notion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Procesa cuando una tarea es desmarcada como completada
   */
  private async processTaskUncompletion(
    payload: TodoistWebhookPayload
  ): Promise<{
    message: string;
    taskId: string;
    notionPageId?: string;
    eventType: string;
  }> {
    const taskData = payload.event_data!;
    const taskId = taskData.id;

    logger.info('Processing Todoist task uncompletion', {
      taskId,
      taskTitle: taskData.content,
      userId: payload.user_id
    });

    try {
      // Extraer ID de página de Notion
      const notionPageId = extractNotionPageId(taskData.description || '');
      
      if (!notionPageId) {
        logger.warn('No Notion page ID found in task description', {
          taskId,
          description: taskData.description?.substring(0, 100) + '...'
        });
        
        return {
          message: 'Task uncompleted but no Notion page ID found in description',
          taskId,
          eventType: payload.event_name
        };
      }

      // Actualizar status en Notion a estado "no completado"
      const uncompletedStatus = getUncompletedStatusForNotion();
      await updateNotionPageStatus(notionPageId, uncompletedStatus);

      logger.info('Successfully updated Notion page status to uncompleted', {
        taskId,
        notionPageId,
        newStatus: uncompletedStatus,
        taskTitle: taskData.content
      });

      return {
        message: 'Task uncompletion synced to Notion successfully',
        taskId,
        notionPageId,
        eventType: payload.event_name
      };
    } catch (error) {
      logger.error('Error processing Todoist task uncompletion', {
        taskId,
        taskTitle: taskData.content,
        description: taskData.description?.substring(0, 100) + '...',
        error
      });

      throw new Error(`Failed to sync task uncompletion to Notion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Valida el webhook y sus headers
   */
  private validateWebhook(
    payload: TodoistWebhookPayload,
    headers: Record<string, string | null>
  ): void {
    // Verificar Content-Type
    const contentType = headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new ValidationError('Invalid content type. Expected application/json');
    }

    // Verificar User-Agent de Todoist
    const userAgent = headers['user-agent'];
    if (userAgent && !userAgent.includes('Todoist-Webhooks')) {
      logger.warn('Unexpected User-Agent for Todoist webhook', { userAgent });
    }

    // Verificar que tenemos los datos mínimos requeridos
    if (!payload.event_name || !payload.user_id || !payload.event_data) {
      throw new ValidationError('Missing required webhook data');
    }
  }
}
