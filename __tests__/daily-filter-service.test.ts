import { DailyFilterService } from '@/services/daily-filter.service';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('DailyFilterService', () => {
  let service: DailyFilterService;
  const mockToken = 'test-token';
  const mockProjectId = 'test-project-id';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.TODOIST_API_TOKEN = mockToken;
    process.env.TODOIST_DAILY_PROJECT_ID = mockProjectId;
    
    service = new DailyFilterService();
  });

  afterEach(() => {
    delete process.env.TODOIST_API_TOKEN;
    delete process.env.TODOIST_DAILY_PROJECT_ID;
  });

  describe('constructor', () => {
    it('should throw error if no token is provided', () => {
      delete process.env.TODOIST_API_TOKEN;
      delete process.env.TODOIST_API_TOKEN;
      
      expect(() => new DailyFilterService()).toThrow('TODOIST_API_TOKEN or TODOIST_API_TOKEN is required');
    });

    it('should throw error if no project ID is provided', () => {
      delete process.env.TODOIST_DAILY_PROJECT_ID;
      
      expect(() => new DailyFilterService()).toThrow('TODOIST_DAILY_PROJECT_ID is required');
    });

    it('should fallback to TODOIST_API_TOKEN if TODOIST_API_TOKEN is not available', () => {
      delete process.env.TODOIST_API_TOKEN;
      process.env.TODOIST_API_TOKEN = 'fallback-token';
      
      expect(() => new DailyFilterService()).not.toThrow();
    });
  });

  describe('processDailyFilter', () => {
    const mockSections = [
      { id: 'section-1', name: 'Lunes', project_id: mockProjectId },
      { id: 'section-2', name: 'Martes', project_id: mockProjectId },
      { id: 'section-3', name: 'Miércoles', project_id: mockProjectId },
    ];

    const mockTasks = [
      {
        id: 'task-1',
        content: 'Tarea de prueba 1',
        description: 'Descripción 1',
        section_id: 'section-1',
        project_id: mockProjectId,
        is_completed: false,
      },
      {
        id: 'task-2',
        content: 'Tarea de prueba 2',
        description: 'Descripción 2',
        section_id: 'section-1',
        project_id: mockProjectId,
        is_completed: true,
      },
    ];

    beforeEach(() => {
      // Mock Date to return Monday (day 1)
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1);
      // Mock project info fetch (siempre responde con nombre de proyecto)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockProjectId, name: 'Test Project' }),
      } as Response);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully process daily filter for Monday', async () => {

      // Mock sections API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSections,
      } as Response);

      // Mock tasks API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response);

      const result = await service.processDailyFilter();

      expect(result.success).toBe(true);
      expect(result.day).toBe('lunes');
      expect(result.sectionId).toBe('section-1');
      expect(result.sectionName).toBe('Lunes');
      expect(result.tasksCount).toBe(1); // Only non-completed tasks
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].is_completed).toBe(false);
    });

    it('should return error when no section found for the day', async () => {
      // Mock sections without Monday
      const sectionsWithoutMonday = [
        { id: 'section-2', name: 'Martes', project_id: mockProjectId },
        { id: 'section-3', name: 'Miércoles', project_id: mockProjectId },
      ];

      // Mock project info fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockProjectId, name: 'Test Project' }),
      } as Response);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sectionsWithoutMonday,
      } as Response);

      const result = await service.processDailyFilter();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No se encontró sección para el día: lunes');
      expect(result.sectionId).toBeNull();
      expect(result.tasksCount).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock project info fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockProjectId, name: 'Test Project' }),
      } as Response);
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.processDailyFilter();

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(logger.error).toHaveBeenCalledWith('Error processing daily filter', expect.any(Object));
    });

    it('should handle network errors for sections fetch', async () => {
      // Mock project info fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockProjectId, name: 'Test Project' }),
      } as Response);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await service.processDailyFilter();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch sections: 500');
    });

    it('should handle different day names correctly', async () => {

      // Test for Tuesday (day 2)
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(2);
      // Mock project info fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockProjectId, name: 'Test Project' }),
      } as Response);

      const tuesdaySections = [
        { id: 'section-2', name: 'Martes', project_id: mockProjectId },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tuesdaySections,
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await service.processDailyFilter();

      expect(result.success).toBe(true);
      expect(result.day).toBe('martes');
      expect(result.sectionName).toBe('Martes');
    });

    it('should filter out completed tasks', async () => {

      // Mock project info fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockProjectId, name: 'Test Project' }),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSections,
      } as Response);

      // All tasks completed
      const allCompletedTasks = mockTasks.map(task => ({ ...task, is_completed: true }));
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => allCompletedTasks,
      } as Response);

      const result = await service.processDailyFilter();

      expect(result.success).toBe(true);
      expect(result.tasksCount).toBe(0);
      expect(result.tasks).toHaveLength(0);
    });
  });

  describe('getProjectInfo', () => {
    it('should fetch project info successfully', async () => {
      const mockProject = {
        id: mockProjectId,
        name: 'Test Project',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      } as Response);

      const result = await service.getProjectInfo();

      expect(result).toEqual(mockProject);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.todoist.com/rest/v2/projects/${mockProjectId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should return null on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await service.getProjectInfo();

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching project info',
        expect.objectContaining({ projectId: mockProjectId })
      );
    });
  });
});
