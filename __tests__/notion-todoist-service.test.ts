/**
 * Tests para el servicio NotionTodoistService con la nueva funcionalidad de eliminación de menciones
 */

import { NotionTodoistService } from '@/services/webhooks/notion-todoist.service';
import * as todoistClient from '@/utils/todoist-client';

// Mocks
jest.mock('@/utils/todoist-client', () => ({
  findTaskByNotionUrl: jest.fn(),
  deleteTodoistTask: jest.fn(),
  createTodoistTask: jest.fn(),
  updateTodoistTask: jest.fn(),
  completeTodoistTask: jest.fn(),
  formatDateForTodoist: jest.fn(),
  findOrCreateProjectByWorkspace: jest.fn(),
}));

jest.mock('@/utils/notion-client', () => ({
  getNotionPageContent: jest.fn(),
  getNotionPageStatus: jest.fn(),
}));

jest.mock('@/lib/config', () => ({
  config: {
    todoist: {
      projectId: 'test-project-id'
    },
    openai: {
      enabled: false,
      apiKey: null
    }
  }
}));

describe('NotionTodoistService - handleMentionRemoval', () => {
  let service: NotionTodoistService;

  beforeEach(() => {
    service = new NotionTodoistService();
    jest.clearAllMocks();
  });

  describe('handleMentionRemoval', () => {
    it('debe eliminar una tarea existente cuando se quita la mención', async () => {
      const pageId = 'test-page-123';
      const mockTask = {
        id: 'task-456',
        content: 'Test Task',
        description: 'Test description with notion.so/test-page-123'
      };

      // Mock que encuentra una tarea existente
      (todoistClient.findTaskByNotionUrl as jest.Mock).mockResolvedValue(mockTask);
      (todoistClient.deleteTodoistTask as jest.Mock).mockResolvedValue(undefined);

      const result = await service.handleMentionRemoval(pageId);

      expect(todoistClient.findTaskByNotionUrl).toHaveBeenCalledWith(pageId);
      expect(todoistClient.deleteTodoistTask).toHaveBeenCalledWith('task-456');
      expect(result).toEqual({
        taskDeleted: true,
        taskId: 'task-456'
      });
    });

    it('debe retornar taskDeleted: false cuando no hay tarea existente', async () => {
      const pageId = 'test-page-456';

      // Mock que NO encuentra una tarea existente
      (todoistClient.findTaskByNotionUrl as jest.Mock).mockResolvedValue(null);

      const result = await service.handleMentionRemoval(pageId);

      expect(todoistClient.findTaskByNotionUrl).toHaveBeenCalledWith(pageId);
      expect(todoistClient.deleteTodoistTask).not.toHaveBeenCalled();
      expect(result).toEqual({
        taskDeleted: false
      });
    });

    it('debe manejar errores al buscar la tarea', async () => {
      const pageId = 'test-page-error';
      const error = new Error('Error buscando tarea');

      // Mock que falla al buscar
      (todoistClient.findTaskByNotionUrl as jest.Mock).mockRejectedValue(error);

      const result = await service.handleMentionRemoval(pageId);

      expect(result).toEqual({
        taskDeleted: false,
        error: 'Error buscando tarea'
      });
    });

    it('debe manejar errores al eliminar la tarea', async () => {
      const pageId = 'test-page-delete-error';
      const mockTask = {
        id: 'task-error',
        content: 'Test Task'
      };
      const deleteError = new Error('Error eliminando tarea');

      // Mock que encuentra la tarea pero falla al eliminar
      (todoistClient.findTaskByNotionUrl as jest.Mock).mockResolvedValue(mockTask);
      (todoistClient.deleteTodoistTask as jest.Mock).mockRejectedValue(deleteError);

      const result = await service.handleMentionRemoval(pageId);

      expect(todoistClient.findTaskByNotionUrl).toHaveBeenCalledWith(pageId);
      expect(todoistClient.deleteTodoistTask).toHaveBeenCalledWith('task-error');
      expect(result).toEqual({
        taskDeleted: false,
        error: 'Error eliminando tarea'
      });
    });
  });
});
