/**
 * Tests refactorizados para la nueva arquitectura
 */

import { NotionWebhookService } from '@/services/webhooks/notion-webhook.service';
import * as webhookValidator from '@/utils/notion-webhook-validator';

// Mock de dependencias
jest.mock('@/utils/notion-webhook-validator', () => ({
  isValidNotionWebhook: jest.fn(),
  shouldProcessEvent: jest.fn(),
  getEventAction: jest.fn(),
}));

jest.mock('@/utils/notion-client', () => ({
  isUserMentioned: jest.fn(),
  getNotionPageContent: jest.fn(),
  getNotionPageStatus: jest.fn(),
}));

jest.mock('@/services/webhooks/notion-todoist.service', () => ({
  NotionTodoistService: jest.fn().mockImplementation(() => ({
    processPage: jest.fn(),
  })),
}));

describe('NotionWebhookService', () => {
  let service: NotionWebhookService;
  
  beforeEach(() => {
    service = new NotionWebhookService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Limpiar timeouts pendientes para evitar warnings de Jest
    service.cleanup();
  });

  describe('Validación de webhook', () => {
    it('debe rechazar webhooks que no provienen de Notion', async () => {
      (webhookValidator.isValidNotionWebhook as jest.Mock).mockReturnValue(false);

      const payload = { entity: { id: 'test-page', type: 'page' } };
      const headers = { 'user-agent': 'not-notion', 'x-notion-signature': null };

      await expect(service.processWebhook(payload, headers))
        .rejects.toThrow('Invalid webhook - not from Notion');
    });

    it('debe aceptar webhooks válidos de Notion', async () => {
      (webhookValidator.isValidNotionWebhook as jest.Mock).mockReturnValue(true);
      (webhookValidator.shouldProcessEvent as jest.Mock).mockReturnValue(true);
      (webhookValidator.getEventAction as jest.Mock).mockReturnValue('create');

      const payload = { 
        entity: { id: 'test-page', type: 'page' },
        type: 'page.created'
      };
      const headers = { 
        'user-agent': 'notion-api', 
        'x-notion-signature': 'valid-signature' 
      };

      const result = await service.processWebhook(payload, headers);
      
      expect(result.message).toContain('Event scheduled for processing');
      expect(result.pageId).toBe('test-page');
      expect(result.eventAction).toBe('create');
    });
  });

  describe('Manejo de verificación', () => {
    it('debe manejar verificación de Notion', async () => {
      (webhookValidator.isValidNotionWebhook as jest.Mock).mockReturnValue(true);

      const payload = { verification_token: 'test-token-123' };
      const headers = { 'user-agent': 'notion-api', 'x-notion-signature': 'signature' };

      const result = await service.processWebhook(payload, headers);
      
      expect('verification_token' in result && (result as { verification_token: string }).verification_token).toBe('test-token-123');
      expect(result.message).toBe('Verification successful');
    });
  });

  describe('Validación de eventos', () => {
    it('debe rechazar eventos que no son de páginas', async () => {
      (webhookValidator.isValidNotionWebhook as jest.Mock).mockReturnValue(true);

      // Un payload sin pageId debería fallar en extractPageId
      const payload = {};
      const headers = { 'user-agent': 'notion-api', 'x-notion-signature': 'signature' };

      await expect(service.processWebhook(payload, headers))
        .rejects.toThrow('Invalid payload: missing page ID');
    });

    it('debe rechazar eventos de tipo database', async () => {
      (webhookValidator.isValidNotionWebhook as jest.Mock).mockReturnValue(true);

      const payload = { entity: { id: 'test-db', type: 'database' } };
      const headers = { 'user-agent': 'notion-api', 'x-notion-signature': 'signature' };

      await expect(service.processWebhook(payload, headers))
        .rejects.toThrow('Event ignored - not a page');
    });

    it('debe rechazar eventos de páginas eliminadas', async () => {
      (webhookValidator.isValidNotionWebhook as jest.Mock).mockReturnValue(true);
      (webhookValidator.shouldProcessEvent as jest.Mock).mockReturnValue(false);

      const payload = { 
        entity: { id: 'test-page', type: 'page' },
        type: 'page.deleted'
      };
      const headers = { 'user-agent': 'notion-api', 'x-notion-signature': 'signature' };

      await expect(service.processWebhook(payload, headers))
        .rejects.toThrow('Event ignored - page deleted');
    });
  });

  describe('Debouncing de eventos', () => {
    it('debe programar evento para procesamiento con debounce', async () => {
      (webhookValidator.isValidNotionWebhook as jest.Mock).mockReturnValue(true);
      (webhookValidator.shouldProcessEvent as jest.Mock).mockReturnValue(true);
      (webhookValidator.getEventAction as jest.Mock).mockReturnValue('update');

      const payload = { 
        entity: { id: 'test-page', type: 'page' },
        type: 'page.updated'
      };
      const headers = { 'user-agent': 'notion-api', 'x-notion-signature': 'signature' };

      const result = await service.processWebhook(payload, headers);
      
      expect(result.message).toContain('Event scheduled for processing');
      expect(result.pageId).toBe('test-page');
      expect(result.eventAction).toBe('update');
      expect(result.debounceTimeMs).toBe(60000);
    });
  });

  describe('Estadísticas del servicio', () => {
    it('debe retornar estadísticas del servicio', () => {
      const stats = service.getStats();
      
      expect(stats).toHaveProperty('currentlyTrackedPages');
      expect(stats).toHaveProperty('pendingEvents');
      expect(typeof stats.currentlyTrackedPages).toBe('number');
      expect(typeof stats.pendingEvents).toBe('number');
    });
  });
});

// Payloads de prueba basados en casos reales
export const testPayloads = {
  verification: {
    verification_token: 'test-verification-token-123'
  },

  pageCreated: {
    id: 'test-event-id',
    timestamp: '2025-07-15T20:25:39.546Z',
    workspace_id: 'test-workspace-id',
    workspace_name: 'Test Workspace',
    type: 'page.created',
    entity: {
      id: 'test-page-id',
      type: 'page'
    }
  },

  pageUpdated: {
    id: 'test-event-id-2',
    timestamp: '2025-07-15T20:25:40.869Z',
    workspace_id: 'test-workspace-id',
    workspace_name: 'Test Workspace',
    type: 'page.updated',
    entity: {
      id: 'test-page-id',
      type: 'page'
    }
  },

  pageDeleted: {
    id: 'test-event-id-3',
    timestamp: '2025-07-15T20:25:38.394Z',
    workspace_id: 'test-workspace-id',
    workspace_name: 'Test Workspace',
    type: 'page.deleted',
    entity: {
      id: 'test-page-id',
      type: 'page'
    }
  },

  invalidEntity: {
    id: 'test-event-id-4',
    timestamp: '2025-07-15T20:25:39.546Z',
    workspace_id: 'test-workspace-id',
    workspace_name: 'Test Workspace',
    type: 'database.created',
    entity: {
      id: 'test-database-id',
      type: 'database'
    }
  }
};
