/**
 * Servicio para health checks de la aplicación
 */

import { config } from '@/lib/config';
import { HealthCheckResponse } from '@/lib/api-response';

export class HealthCheckService {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Obtiene el estado de salud de la aplicación
   */
  getHealthStatus(): HealthCheckResponse {
    const uptime = Date.now() - this.startTime;
    
    return {
      status: 'healthy',
      message: 'Notion-Todoist Webhook API is running',
      timestamp: new Date().toISOString(),
      uptime,
      endpoints: {
        webhook: 'POST /api/notion-webhook',
        health: 'GET /api/notion-webhook',
      },
      configuration: {
        notionUserIdConfigured: !!config.notion.userId,
        todoistProjectIdConfigured: !!config.todoist.projectId, // Optional: used as fallback when dynamic project creation fails
        aiEnhancementEnabled: config.openai.enabled,
        openaiConfigured: !!config.openai.apiKey,
      },
      features: {
        duplicatePrevention: 'Latest-event debounce system (60s window)',
        taskUpdates: 'Updates existing Todoist tasks for page property changes',
        aiEnhancement: config.openai.enabled ? 'Enabled' : 'Disabled',
        workspaceTags: 'Automatic workspace labeling',
        mentionDetection: 'User-specific filtering',
        dynamicProjectCreation: 'Creates projects per workspace automatically',
      },
    };
  }

  /**
   * Verifica que la configuración mínima esté presente
   */
  checkMinimalConfiguration(): { isValid: boolean; missingConfig: string[] } {
    const missingConfig: string[] = [];

    if (!config.todoist.apiToken) {
      missingConfig.push('TODOIST_API_TOKEN');
    }

    return {
      isValid: missingConfig.length === 0,
      missingConfig,
    };
  }
}
