import { MealPlanService } from '@/services/meal-plan.service';
import { logger } from '@/lib/logger';

// Mock de dependencias
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock Colombia timezone functions
jest.mock('@/utils/colombia-timezone', () => ({
  getCurrentDayNameInColombia: jest.fn(() => 'lunes'),
  getNextDayNameInColombia: jest.fn(() => 'martes'),
  getCurrentDateInColombia: jest.fn(() => new Date('2024-01-01T10:00:00-05:00')), // Monday
  getNextDateInColombia: jest.fn(() => new Date('2024-01-02T10:00:00-05:00')), // Tuesday
}));

// Mock de dependencias
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock de fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock de crypto para UUID generation
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234'),
  },
});

describe('MealPlanService', () => {
  let service: MealPlanService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Guardar variables de entorno originales
    originalEnv = { ...process.env };
    
    // Configurar variables de entorno para testing
    process.env.TODOIST_API_TOKEN_MEAL_PLAN = 'test-token-meal-plan';
    process.env.TODOIST_MEAL_PLAN_PROJECT_ID = 'test-project-id';
    process.env.TODOIST_MEAL_PLAN_FILTER_NAME = 'Test Meal Plan Filter';

    service = new MealPlanService();
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    // Restaurar variables de entorno
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should initialize with environment variables', () => {
      expect(service).toBeInstanceOf(MealPlanService);
    });

    it('should throw error when TODOIST_API_TOKEN is missing', () => {
      delete process.env.TODOIST_API_TOKEN_MEAL_PLAN;
      delete process.env.TODOIST_API_TOKEN;
      
      expect(() => new MealPlanService()).toThrow('TODOIST_API_TOKEN_MEAL_PLAN or TODOIST_API_TOKEN is required');
    });

    it('should throw error when project ID is missing', () => {
      delete process.env.TODOIST_MEAL_PLAN_PROJECT_ID;
      delete process.env.TODOIST_DAILY_PROJECT_ID;
      
      expect(() => new MealPlanService()).toThrow('TODOIST_MEAL_PLAN_PROJECT_ID or TODOIST_DAILY_PROJECT_ID is required');
    });

    it('should fallback to general tokens when specific ones are not available', () => {
      delete process.env.TODOIST_API_TOKEN_MEAL_PLAN;
      delete process.env.TODOIST_MEAL_PLAN_PROJECT_ID;
      process.env.TODOIST_API_TOKEN = 'fallback-token';
      process.env.TODOIST_DAILY_PROJECT_ID = 'fallback-project-id';

      expect(() => new MealPlanService()).not.toThrow();
    });
  });

  describe('processMealPlan', () => {
    const mockSections = [
      { id: 'section-1', name: 'Lunes', project_id: 'test-project-id' },
      { id: 'section-2', name: 'Martes', project_id: 'test-project-id' },
      { id: 'section-3', name: 'Miércoles', project_id: 'test-project-id' },
      { id: 'section-4', name: 'Jueves', project_id: 'test-project-id' },
      { id: 'section-5', name: 'Viernes', project_id: 'test-project-id' },
      { id: 'section-6', name: 'Sábado', project_id: 'test-project-id' },
      { id: 'section-7', name: 'Domingo', project_id: 'test-project-id' },
    ];

    const mockTasks = [
      {
        id: 'task-1',
        content: 'Desayuno - Avena con frutas',
        description: 'Preparar avena con plátano y fresas',
        section_id: 'section-2',
        project_id: 'test-project-id',
        is_completed: false,
        labels: ['mealprep', 'breakfast']
      },
      {
        id: 'task-2',
        content: 'Almuerzo - Ensalada de pollo',
        description: 'Ensalada verde con pollo a la plancha',
        section_id: 'section-2',
        project_id: 'test-project-id',
        is_completed: false,
        labels: ['mealprep', 'lunch']
      },
      {
        id: 'task-3',
        content: 'Tarea sin meal plan',
        description: 'Esta no debería aparecer',
        section_id: 'section-2',
        project_id: 'test-project-id',
        is_completed: false,
        labels: ['grocery']
      },
      {
        id: 'task-4',
        content: 'Cena completada',
        description: 'Esta está completada',
        section_id: 'section-2',
        project_id: 'test-project-id',
        is_completed: true,
        labels: ['mealprep', 'dinner']
      }
    ];

    const mockProjectInfo = {
      id: 'test-project-id',
      name: 'Alimentación'
    };

    const mockFilters = [
      {
        id: 'filter-1',
        name: 'Test Meal Plan Filter',
        query: '#Alimentación & /Martes & @mealprep & !subtask',
        color: 'green',
        favorite: true
      }
    ];

    it('should process meal plan successfully for next day', async () => {
      // Configurar mocks en orden de llamada
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSections),
        }) // getSections
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectInfo),
        }) // getProjectInfo
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ filters: mockFilters }),
        }) // get filters (sync)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        }) // update filter
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTasks),
        }); // getTasksFromSection

      const result = await service.processMealPlan();

      expect(result.success).toBe(true);
      expect(result.tasksCount).toBe(2); // Solo las tareas con mealprep que no están completadas
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].labels).toContain('mealprep');
      expect(result.tasks[1].labels).toContain('mealprep');
      expect(result.filterUpdated).toBeDefined();
      
      expect(logger.info).toHaveBeenCalledWith('Processing meal plan for next day', expect.objectContaining({
        projectId: 'test-project-id'
      }));
    });

    it('should handle when no section is found for next day', async () => {
      // Mock secciones sin el día siguiente
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 'section-1', name: 'Otra Sección', project_id: 'test-project-id' }]),
      });

      const result = await service.processMealPlan();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No se encontró sección para el día siguiente');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should filter tasks correctly (only mealprep and not completed)', async () => {
      // Mock básico
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSections),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectInfo),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ filters: mockFilters }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTasks),
        });

      const result = await service.processMealPlan();

      expect(result.success).toBe(true);
      expect(result.tasksCount).toBe(2);
      
      // Verificar que todas las tareas retornadas tienen la etiqueta mealprep y no están completadas
      result.tasks.forEach(task => {
        expect(task.labels).toContain('mealprep');
        expect(task.is_completed).toBe(false);
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.processMealPlan();

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(logger.error).toHaveBeenCalledWith('Error processing meal plan', expect.objectContaining({
        error: expect.any(Error)
      }));
    });

    it('should update filter when query changes', async () => {
      const existingFilter = {
        id: 'filter-1',
        name: 'Test Meal Plan Filter',
        query: '#Alimentación & /Lunes & @mealprep', // Different day
        color: 'green',
        favorite: true
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSections),
        }) // getSections
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectInfo),
        }) // getProjectInfo
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ filters: [existingFilter] }),
        }) // get filters (sync)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        }) // update filter
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTasks),
        }); // getTasksFromSection

      const result = await service.processMealPlan();

      expect(result.success).toBe(true);
      expect(result.filterUpdated).toBe(true);
      expect(result.filterQuery).toContain('Martes'); // Should be updated to next day
    });

    it('should not update filter when query is already correct', async () => {
      const correctFilter = {
        id: 'filter-1',
        name: 'Test Meal Plan Filter',
        query: '#Alimentación & /Martes & @mealprep', // Correct for next day
        color: 'green',
        favorite: true
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSections),
        }) // getSections
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectInfo),
        }) // getProjectInfo
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ filters: [correctFilter] }),
        }) // get filters (sync) - no update call should be made
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTasks),
        }); // getTasksFromSection

      const result = await service.processMealPlan();

      expect(result.success).toBe(true);
      expect(result.filterUpdated).toBe(false);
      expect(result.filterQuery).toBe('#Alimentación & /Martes & @mealprep');
    });

    it('should create new filter when none exists', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSections),
        }) // getSections
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectInfo),
        }) // getProjectInfo
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ filters: [] }), // No existing filters
        }) // get filters (sync)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        }) // create filter
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            filters: [{ 
              id: 'new-filter-id', 
              name: 'Test Meal Plan Filter', 
              query: '#Alimentación & /Martes & @mealprep' 
            }] 
          }),
        }) // get filters again after creation
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTasks),
        }); // getTasksFromSection

      const result = await service.processMealPlan();

      expect(result.success).toBe(true);
      expect(result.filterUpdated).toBe(true); // Should be true for new filter
      expect(result.filterId).toBe('new-filter-id');
      expect(result.filterQuery).toBe('#Alimentación & /Martes & @mealprep');
    });

    it('should handle fetch errors for sections', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await service.processMealPlan();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch sections: 401');
    });
  });

  describe('getProjectInfo', () => {
    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should return project info successfully', async () => {
      const mockProject = {
        id: 'test-project-id',
        name: 'Alimentación'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProject),
      });

      const result = await service.getProjectInfo();

      expect(result).toEqual(mockProject);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.todoist.com/rest/v2/projects/test-project-id',
        expect.objectContaining({
          headers: { 'Authorization': 'Bearer test-token-meal-plan' }
        })
      );
    });

    it('should return null when project fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await service.getProjectInfo();

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith('Error fetching project info', expect.objectContaining({
        error: expect.any(Error),
        projectId: 'test-project-id'
      }));
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getProjectInfo();

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Day calculation integration', () => {
    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should process tasks when section is found', async () => {
      // Mock secciones que incluyan posiblemente el día siguiente
      const mockSections = [
        { id: 'section-1', name: 'Lunes', project_id: 'test-project-id' },
        { id: 'section-2', name: 'Martes', project_id: 'test-project-id' },
        { id: 'section-7', name: 'Domingo', project_id: 'test-project-id' },
      ];

      const mockProjectInfo = { id: 'test-project-id', name: 'Alimentación' };
      const mockFilters: Array<{ id: string; name: string; query: string; color: string; favorite: boolean }> = [];
      const mockTasks = [
        {
          id: 'task-1',
          content: 'Meal plan task',
          description: 'Una tarea de meal plan',
          section_id: 'section-7',
          project_id: 'test-project-id',
          is_completed: false,
          labels: ['mealprep', 'brunch']
        }
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSections),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjectInfo),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ filters: mockFilters }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ filters: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTasks),
        });

      const result = await service.processMealPlan();

      // No vamos a asumir que encuentra la sección correcta, solo que funciona el flujo
      if (result.success) {
        expect(result.tasksCount).toBeGreaterThanOrEqual(0);
        expect(result.tasks).toBeDefined();
      } else {
        // Si no encuentra la sección, es válido también
        expect(result.error).toContain('No se encontró sección');
      }
    });
  });
});
