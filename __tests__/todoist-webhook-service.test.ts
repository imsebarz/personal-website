/**
 * Tests para TodoistWebhookService
 */

import { TodoistWebhookService } from '@/services/webhooks/todoist-webhook.service';
import * as todoistValidator from '@/utils/todoist-webhook-validator';
import * as notionClient from '@/utils/notion-client';

// Mock de dependencias
jest.mock('@/utils/todoist-webhook-validator');
jest.mock('@/utils/notion-client');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockTodoistValidator = todoistValidator as jest.Mocked<typeof todoistValidator>;
const mockNotionClient = notionClient as jest.Mocked<typeof notionClient>;

describe('TodoistWebhookService', () => {
  let service: TodoistWebhookService;

  beforeEach(() => {
    service = new TodoistWebhookService();
    jest.clearAllMocks();
  });

  describe('processWebhook', () => {
    const mockPayload = {
      event_name: 'item:completed',
      user_id: '123456',
      event_data: {
        id: 'task123',
        content: 'Test task',
        description: 'Test description with https://notion.so/12345678-1234-1234-1234-123456789abc',
        project_id: 'project123',
        section_id: null,
        parent_id: null,
        order: 1,
        labels: [],
        priority: 1,
        url: 'https://todoist.com/task/123',
        comment_count: 0,
        created_at: '2025-01-15T10:00:00Z',
        creator_id: '123456',
        assignee_id: null,
        assigner_id: null,
        is_completed: true,
        completed_at: '2025-01-15T11:00:00Z',
        added_at: '2025-01-15T10:00:00Z',
        added_by_uid: '123456',
        assigned_by_uid: null,
        responsible_uid: null,
        checked: true,
        child_order: 1,
        collapsed: false,
        deadline: null,
        is_deleted: false,
        user_id: '123456'
      },
      initiator: {
        email: 'test@example.com',
        full_name: 'Test User',
        id: '123456',
        is_premium: false
      },
      triggered_at: '2025-01-15T11:00:00Z',
      version: '10'
    };

    const mockHeaders = {
      'content-type': 'application/json',
      'user-agent': 'Todoist-Webhooks',
      'x-todoist-hmac-sha256': 'valid-signature',
      'x-todoist-delivery-id': 'delivery-123'
    };

    it('should successfully process a valid task completion', async () => {
      // Setup mocks
      mockTodoistValidator.isValidTodoistPayload.mockReturnValue(true);
      mockTodoistValidator.isValidTodoistWebhook.mockReturnValue(true);
      mockTodoistValidator.shouldProcessTodoistEvent.mockReturnValue(true);
      mockTodoistValidator.extractNotionPageId.mockReturnValue('12345678-1234-1234-1234-123456789abc');
      mockTodoistValidator.getCompletedStatusForNotion.mockReturnValue('Completado');
      mockNotionClient.updateNotionPageStatus.mockResolvedValue();

      const result = await service.processWebhook(mockPayload, mockHeaders, JSON.stringify(mockPayload));

      expect(result).toEqual({
        message: 'Task completion synced to Notion successfully',
        taskId: 'task123',
        notionPageId: '12345678-1234-1234-1234-123456789abc',
        eventType: 'item:completed'
      });

      expect(mockNotionClient.updateNotionPageStatus).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789abc',
        'Completado'
      );
    });

    it('should throw ValidationError for invalid payload structure', async () => {
      mockTodoistValidator.isValidTodoistPayload.mockReturnValue(false);

      await expect(
        service.processWebhook(mockPayload, mockHeaders, JSON.stringify(mockPayload))
      ).rejects.toThrow('Invalid Todoist webhook payload structure');
    });

    it('should throw ValidationError for invalid webhook signature', async () => {
      process.env.TODOIST_WEBHOOK_SECRET = 'test-secret';
      
      mockTodoistValidator.isValidTodoistPayload.mockReturnValue(true);
      mockTodoistValidator.isValidTodoistWebhook.mockReturnValue(false);

      await expect(
        service.processWebhook(mockPayload, mockHeaders, JSON.stringify(mockPayload))
      ).rejects.toThrow('Invalid Todoist webhook signature');

      delete process.env.TODOIST_WEBHOOK_SECRET;
    });

    it('should skip events that should not be processed', async () => {
      mockTodoistValidator.isValidTodoistPayload.mockReturnValue(true);
      mockTodoistValidator.isValidTodoistWebhook.mockReturnValue(true);
      mockTodoistValidator.shouldProcessTodoistEvent.mockReturnValue(false);

      const result = await service.processWebhook(mockPayload, mockHeaders, JSON.stringify(mockPayload));

      expect(result).toEqual({
        message: 'Event skipped - not relevant for Notion sync',
        eventType: 'item:completed',
        taskId: 'task123'
      });

      expect(mockNotionClient.updateNotionPageStatus).not.toHaveBeenCalled();
    });

    it('should handle task completion without Notion page ID', async () => {
      mockTodoistValidator.isValidTodoistPayload.mockReturnValue(true);
      mockTodoistValidator.isValidTodoistWebhook.mockReturnValue(true);
      mockTodoistValidator.shouldProcessTodoistEvent.mockReturnValue(true);
      mockTodoistValidator.extractNotionPageId.mockReturnValue(null);

      const result = await service.processWebhook(mockPayload, mockHeaders, JSON.stringify(mockPayload));

      expect(result).toEqual({
        message: 'Task completed but no Notion page ID found in description',
        taskId: 'task123',
        eventType: 'item:completed'
      });

      expect(mockNotionClient.updateNotionPageStatus).not.toHaveBeenCalled();
    });

    it('should handle errors when updating Notion page status', async () => {
      const notionError = new Error('Failed to update Notion page');
      
      mockTodoistValidator.isValidTodoistPayload.mockReturnValue(true);
      mockTodoistValidator.isValidTodoistWebhook.mockReturnValue(true);
      mockTodoistValidator.shouldProcessTodoistEvent.mockReturnValue(true);
      mockTodoistValidator.extractNotionPageId.mockReturnValue('12345678-1234-1234-1234-123456789abc');
      mockTodoistValidator.getCompletedStatusForNotion.mockReturnValue('Completado');
      mockNotionClient.updateNotionPageStatus.mockRejectedValue(notionError);

      await expect(
        service.processWebhook(mockPayload, mockHeaders, JSON.stringify(mockPayload))
      ).rejects.toThrow('Failed to sync task completion to Notion: Failed to update Notion page');
    });

    it('should process webhook without signature validation when secret is not configured', async () => {
      // Asegurarse de que no hay secret configurado
      const originalSecret = process.env.TODOIST_WEBHOOK_SECRET;
      delete process.env.TODOIST_WEBHOOK_SECRET;

      mockTodoistValidator.isValidTodoistPayload.mockReturnValue(true);
      mockTodoistValidator.shouldProcessTodoistEvent.mockReturnValue(true);
      mockTodoistValidator.extractNotionPageId.mockReturnValue('12345678-1234-1234-1234-123456789abc');
      mockTodoistValidator.getCompletedStatusForNotion.mockReturnValue('Completado');
      mockNotionClient.updateNotionPageStatus.mockResolvedValue();

      const result = await service.processWebhook(mockPayload, mockHeaders, JSON.stringify(mockPayload));

      expect(result.message).toBe('Task completion synced to Notion successfully');
      expect(mockTodoistValidator.isValidTodoistWebhook).not.toHaveBeenCalled();

      // Restaurar el valor original
      if (originalSecret) {
        process.env.TODOIST_WEBHOOK_SECRET = originalSecret;
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle payloads with missing optional fields', async () => {
      const minimalPayload = {
        event_name: 'item:completed',
        user_id: '123456',
        event_data: {
          id: 'task123',
          content: 'Minimal task',
          description: 'https://notion.so/12345678-1234-1234-1234-123456789abc',
          project_id: 'project123',
          order: 1,
          labels: [],
          priority: 1,
          url: 'https://todoist.com/task/123',
          comment_count: 0,
          created_at: '2025-01-15T10:00:00Z',
          creator_id: '123456',
          is_completed: true,
          completed_at: '2025-01-15T11:00:00Z',
          added_at: '2025-01-15T10:00:00Z',
          added_by_uid: '123456',
          checked: true,
          child_order: 1,
          collapsed: false,
          is_deleted: false,
          user_id: '123456'
        },
        initiator: {
          email: 'test@example.com',
          full_name: 'Test User',
          id: '123456',
          is_premium: false
        },
        triggered_at: '2025-01-15T11:00:00Z',
        version: '10'
      };

      const mockHeaders = {
        'content-type': 'application/json',
        'user-agent': 'Todoist-Webhooks',
        'x-todoist-delivery-id': 'delivery-123'
      };

      mockTodoistValidator.isValidTodoistPayload.mockReturnValue(true);
      mockTodoistValidator.shouldProcessTodoistEvent.mockReturnValue(true);
      mockTodoistValidator.extractNotionPageId.mockReturnValue('12345678-1234-1234-1234-123456789abc');
      mockTodoistValidator.getCompletedStatusForNotion.mockReturnValue('Completado');
      mockNotionClient.updateNotionPageStatus.mockResolvedValue();

      const result = await service.processWebhook(minimalPayload, mockHeaders, JSON.stringify(minimalPayload));

      expect(result.message).toBe('Task completion synced to Notion successfully');
    });
  });
});
