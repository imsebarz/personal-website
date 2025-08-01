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

// Mock Colombia timezone functions
jest.mock('@/utils/colombia-timezone', () => ({
  getCurrentDayNameInColombia: jest.fn(() => 'lunes'),
  getCurrentDateInColombia: jest.fn(() => new Date('2024-01-01T10:00:00-05:00')), // Monday
}));

// Mock UUID generation
jest.mock('@/utils/uuid-helpers', () => ({
  generateUUID: jest.fn(() => 'mock-uuid-1234'),
  generateTempId: jest.fn(() => 'temp_mock_1234'),
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
    
    // Reset fetch mock completely for each test
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.TODOIST_API_TOKEN;
    delete process.env.TODOIST_DAILY_PROJECT_ID;
  });

  describe('constructor', () => {
    it('should throw error if no token is provided', () => {
      delete process.env.TODOIST_API_TOKEN_DAILY;
      delete process.env.TODOIST_API_TOKEN;
      
      expect(() => new DailyFilterService()).toThrow('TODOIST_API_TOKEN_DAILY or TODOIST_API_TOKEN is required');
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
      // Reset fetch mock completely for each test  
      mockFetch.mockReset();
    });

    it('should successfully process daily filter for Monday', async () => {
      // Mock all API calls in the correct order:
      // 1. getSections()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSections,
      } as Response);

      // 2. getProjectInfo() (called from syncV1CreateOrUpdateFilter)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockProjectId, name: 'Test Project' }),
      } as Response);

      // 3-5. Sync v9 API calls for filter management
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ filters: [] }), // No existing filters
        } as Response) // Get filters
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}), // Create filter response
        } as Response) // Create filter
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            filters: [{ 
              id: 'new-filter-id', 
              name: 'Alimentacion del día', 
              query: '#Test Project & /Lunes' 
            }] 
          }),
        } as Response); // Get filters after creation

      // 6. getTasksFromSection()
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
      // Mock sections fetch to fail directly
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.processDailyFilter();

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(logger.error).toHaveBeenCalledWith('Error processing daily filter', expect.any(Object));
    });

    it('should handle network errors for sections fetch', async () => {
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
      // Mock sections for lunes (current day according to our timezone mock)
      const lunesSections = [
        { id: 'section-1', name: 'Lunes', project_id: mockProjectId },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => lunesSections,
      } as Response);

      // Mock project info fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockProjectId, name: 'Test Project' }),
      } as Response);

      // Mock sync v9 API calls for filter management
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ filters: [] }), // No existing filters
        } as Response) // Get filters
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}), // Create filter
        } as Response) // Create filter
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            filters: [{ 
              id: 'new-filter-id', 
              name: 'Alimentacion del día', 
              query: '#Test Project & /Lunes' 
            }] 
          }),
        } as Response); // Get filters after creation

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await service.processDailyFilter();

      expect(result.success).toBe(true);
      expect(result.day).toBe('lunes');
      expect(result.sectionName).toBe('Lunes');
    });

    it('should filter out completed tasks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSections,
      } as Response);

      // Mock project info fetch (called from syncV1CreateOrUpdateFilter)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockProjectId, name: 'Test Project' }),
      } as Response);

      // Mock sync v9 API calls for filter management
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ filters: [] }), // No existing filters
        } as Response) // Get filters
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}), // Create filter
        } as Response) // Create filter
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            filters: [{ 
              id: 'new-filter-id', 
              name: 'Alimentacion del día', 
              query: '#Test Project & /Lunes' 
            }] 
          }),
        } as Response); // Get filters after creation

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
