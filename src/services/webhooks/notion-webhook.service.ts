/**
 * Servicio principal para manejar webhooks de Notion
 */

import { NotionWebhookPayload } from '@/types/notion-todoist';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import { ValidationError } from '@/middleware/error-handler';
import { 
  isValidNotionWebhook, 
  shouldProcessEvent,
  getEventAction
} from '@/utils/notion-webhook-validator';
import { isUserMentioned } from '@/utils/notion-client';
import { NotionTodoistService } from './notion-todoist.service';

// Event debouncing management
const recentlyProcessed = new Map<string, number>();
const pendingEvents = new Map<string, { 
  payload: NotionWebhookPayload; 
  workspaceName?: string; 
  timeoutId: NodeJS.Timeout;
}>();

export class NotionWebhookService {
  private notionTodoistService: NotionTodoistService;

  constructor() {
    this.notionTodoistService = new NotionTodoistService();
  }

  /**
   * Procesa un webhook de Notion
   */
  async processWebhook(
    payload: NotionWebhookPayload,
    headers: Record<string, string | null>
  ): Promise<{
    message: string;
    pageId?: string;
    eventAction?: 'create' | 'update' | 'skip';
    debounceTimeMs?: number;
  }> {
    // 1. Validar webhook
    this.validateWebhook(payload, headers);

    // 2. Manejar verificación
    if ('verification_token' in payload) {
      return this.handleVerification(payload.verification_token!);
    }

    // 3. Extraer pageId
    const pageId = this.extractPageId(payload);
    if (!pageId) {
      throw new ValidationError('Invalid payload: missing page ID');
    }

    // 4. Validar evento
    this.validateEvent(payload, pageId);

    // 5. Procesar eventos pendientes antes de manejar el nuevo evento
    await this.processPendingEventsIfNeeded();

    // 6. Implementar debouncing mejorado para Vercel
    return this.handleEventWithDebounce(payload, pageId);
  }

  /**
   * Valida que el webhook proviene de Notion
   */
  private validateWebhook(
    payload: NotionWebhookPayload,
    headers: Record<string, string | null>
  ): void {
    const userAgent = headers['user-agent'];
    const hasNotionSignature = !!headers['x-notion-signature'];
    
    if (!isValidNotionWebhook(userAgent, hasNotionSignature)) {
      throw new ValidationError('Invalid webhook - not from Notion');
    }

    logger.webhookReceived(payload);
  }

  /**
   * Maneja la verificación inicial de Notion
   */
  private handleVerification(token: string): {
    message: string;
    verification_token?: string;
  } {
    logger.info('Notion verification received', { token });
    return {
      message: 'Verification successful',
      verification_token: token,
    };
  }

  /**
   * Extrae el ID de la página del payload
   */
  private extractPageId(payload: NotionWebhookPayload): string | null {
    return payload.entity?.id || payload.page?.id || null;
  }

  /**
   * Valida que el evento debe ser procesado
   */
  private validateEvent(payload: NotionWebhookPayload, pageId: string): void {
    // Verificar que es una página
    if (payload.entity?.type !== 'page' && !payload.page) {
      throw new ValidationError('Event ignored - not a page');
    }

    // Verificar si el evento debe ser procesado
    if (!shouldProcessEvent(payload.type)) {
      if (payload.type === 'page.deleted') {
        logger.info('Page deleted - ignoring event', { pageId });
        throw new ValidationError('Event ignored - page deleted');
      } else {
        logger.info('Event ignored - not relevant', { 
          eventType: payload.type,
          pageId 
        });
        throw new ValidationError(`Event ${payload.type} ignored`);
      }
    }
  }

  /**
   * Maneja el evento con debouncing adaptado para Vercel
   */
  private async handleEventWithDebounce(
    payload: NotionWebhookPayload,
    pageId: string
  ): Promise<{
    message: string;
    pageId: string;
    eventAction: 'create' | 'update' | 'skip';
    debounceTimeMs: number;
  }> {
    const now = Date.now();
    const lastProcessed = recentlyProcessed.get(pageId);
    
    // Cancelar evento pendiente anterior si existe
    const existingPendingEvent = pendingEvents.get(pageId);
    if (existingPendingEvent) {
      clearTimeout(existingPendingEvent.timeoutId);
      logger.info('Canceling previous event, updating with latest', { pageId });
    }
    
    // Verificar si necesitamos debounce o podemos procesar inmediatamente
    const needsDebounce = lastProcessed && (now - lastProcessed) < config.webhooks.debounceTime;
    
    if (needsDebounce) {
      const timeSince = Math.round((now - lastProcessed) / 1000);
      logger.info('Page recently processed, scheduling latest event', { 
        pageId, 
        timeSinceLastProcess: timeSince 
      });
      
      // En lugar de setTimeout, guardamos el evento para el próximo webhook
      pendingEvents.set(pageId, {
        payload,
        workspaceName: payload.workspace_name,
        timeoutId: setTimeout(() => {}, 0) // Placeholder
      });
      
      // Limpiar entradas antiguas
      this.cleanupOldEntries(now);
      
      const eventAction = getEventAction(payload.type);
      
      return {
        message: 'Event debounced - will be processed on next webhook or after cooldown',
        pageId,
        eventAction,
        debounceTimeMs: config.webhooks.debounceTime,
      };
    } else {
      // Procesar inmediatamente si no hay conflicto de debounce
      logger.info('Processing event immediately - no recent processing detected', { pageId });
      
      // Marcar como procesado antes de procesar para evitar duplicados
      recentlyProcessed.set(pageId, now);
      
      // Procesar el evento inmediatamente
      try {
        await this.processDeferredEvent(payload, pageId);
        
        const eventAction = getEventAction(payload.type);
        return {
          message: 'Event processed successfully',
          pageId,
          eventAction,
          debounceTimeMs: 0,
        };
      } catch (error) {
        // Si falla, remover de recentlyProcessed para permitir reintento
        recentlyProcessed.delete(pageId);
        throw error;
      }
    }
  }

  /**
   * Procesa el evento después del debounce
   */
  private async processDeferredEvent(
    payload: NotionWebhookPayload,
    pageId: string
  ): Promise<void> {
    try {
      logger.info('Processing final event for page', { pageId });
      
      // Remover de eventos pendientes
      pendingEvents.delete(pageId);
      
      // Marcar como procesado
      recentlyProcessed.set(pageId, Date.now());
      
      // Verificar mención de usuario si está configurado
      if (config.notion.userId) {
        const isMentioned = await isUserMentioned(pageId, config.notion.userId, payload.workspace_name);
        if (!isMentioned) {
          logger.info('User not mentioned in page - checking for existing task to remove', { pageId });
          
          // Verificar si existe una tarea en Todoist para esta página
          const result = await this.notionTodoistService.handleMentionRemoval(pageId);
          if (result.taskDeleted) {
            logger.info('Task deleted from Todoist due to mention removal', { 
              pageId, 
              taskId: result.taskId 
            });
          } else {
            logger.info('No existing task found to delete', { pageId });
          }
          return;
        }
      }
      
      // Procesar la página
      const eventAction = getEventAction(payload.type);
      const result = await this.notionTodoistService.processPage(
        pageId, 
        payload.workspace_name, 
        eventAction
      );
      
      if (result.success) {
        const actionText = eventAction === 'update' ? 'updated' : 'processed';
        logger.webhookProcessed(pageId, actionText);
      } else {
        logger.error('Error processing page', new Error(result.error || 'Unknown error'), {
          pageId,
          action: eventAction
        });
      }
    } catch (error) {
      logger.error('Error in deferred processing', error as Error, { pageId });
      pendingEvents.delete(pageId);
    }
  }

  /**
   * Procesa eventos pendientes que han superado su tiempo de debounce
   */
  private async processPendingEventsIfNeeded(): Promise<void> {
    const now = Date.now();
    const eventsToProcess: Array<{ pageId: string; payload: NotionWebhookPayload }> = [];
    
    // Identificar eventos que ya pueden ser procesados
    const pendingEntries = Array.from(pendingEvents.entries());
    for (const [pageId, eventData] of pendingEntries) {
      const lastProcessed = recentlyProcessed.get(pageId);
      const timeSinceLastProcess = lastProcessed ? now - lastProcessed : Infinity;
      
      if (timeSinceLastProcess >= config.webhooks.debounceTime) {
        eventsToProcess.push({ pageId, payload: eventData.payload });
        clearTimeout(eventData.timeoutId);
        pendingEvents.delete(pageId);
      }
    }
    
    // Procesar eventos pendientes
    for (const { pageId, payload } of eventsToProcess) {
      try {
        logger.info('Processing pending event that exceeded debounce time', { pageId });
        await this.processDeferredEvent(payload, pageId);
      } catch (error) {
        logger.error('Error processing pending event', error as Error, { pageId });
      }
    }
  }

  /**
   * Limpia entradas antiguas del mapa de procesamiento reciente
   */
  private cleanupOldEntries(now: number): void {
    const entriesToDelete: string[] = [];
    const recentEntries = Array.from(recentlyProcessed.entries());
    for (const [id, timestamp] of recentEntries) {
      if (now - timestamp > config.webhooks.debounceTime * 2) {
        entriesToDelete.push(id);
      }
    }
    entriesToDelete.forEach(id => recentlyProcessed.delete(id));
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats(): {
    currentlyTrackedPages: number;
    pendingEvents: number;
  } {
    return {
      currentlyTrackedPages: recentlyProcessed.size,
      pendingEvents: pendingEvents.size,
    };
  }

  /**
   * Limpia todos los timeouts pendientes y resetea el estado del servicio
   * Útil para testing y cleanup
   */
  cleanup(): void {
    // Cancelar todos los timeouts pendientes
    pendingEvents.forEach(event => {
      clearTimeout(event.timeoutId);
    });
    
    // Limpiar los mapas
    pendingEvents.clear();
    recentlyProcessed.clear();
    
    logger.info('Service cleanup completed', {
      message: 'All pending timeouts cleared and state reset'
    });
  }
}
