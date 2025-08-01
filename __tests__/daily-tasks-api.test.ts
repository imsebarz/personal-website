import { NextRequest } from 'next/server';
import { GET } from '@/app/api/daily-tasks/route';
import { DailyFilterService } from '@/services/daily-filter.service';
import { MealPlanService } from '@/services/meal-plan.service';
import { logger } from '@/lib/logger';

// Mock services
jest.mock('@/services/daily-filter.service');
jest.mock('@/services/meal-plan.service');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const MockedDailyFilterService = DailyFilterService as jest.MockedClass<typeof DailyFilterService>;
const MockedMealPlanService = MealPlanService as jest.MockedClass<typeof MealPlanService>;

describe('/api/daily-tasks', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new NextRequest('http://localhost:3000/api/daily-tasks');
  });

  it('should execute both services successfully', async () => {
    // Mock successful responses for both services
    const mockDailyFilterInstance = {
      processDailyFilter: jest.fn().mockResolvedValue({
        success: true,
        day: 'viernes',
        sectionId: 'section-1',
        sectionName: 'Viernes',
        tasksCount: 5,
        tasks: [],
        projectId: 'project-1',
        filterId: 'filter-1',
        filterQuery: '#Daily & /Viernes',
        filterUpdated: true
      })
    };

    const mockMealPlanInstance = {
      processMealPlan: jest.fn().mockResolvedValue({
        success: true,
        currentDay: 'viernes',
        nextDay: 'sábado',
        sectionId: 'meal-section-1',
        sectionName: 'Sábado',
        tasksCount: 3,
        tasks: [
          {
            id: 'task-1',
            content: 'Desayuno - Avena',
            description: 'Preparar avena con frutas',
            labels: ['mealprep', 'breakfast'],
            due: { date: '2024-08-02', string: 'Sábado' }
          }
        ],
        projectId: 'meal-project-1',
        filterId: 'meal-filter-1',
        filterQuery: '#Alimentación & /Sábado & @mealprep',
        filterUpdated: false
      }),
      getProjectInfo: jest.fn().mockResolvedValue({
        id: 'meal-project-1',
        name: 'Alimentación y Cocina'
      })
    };

    MockedDailyFilterService.mockImplementation(() => mockDailyFilterInstance as unknown as DailyFilterService);
    MockedMealPlanService.mockImplementation(() => mockMealPlanInstance as unknown as MealPlanService);

    const response = await GET(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.message).toBe('Cron job diario ejecutado exitosamente');
    
    // Verify both services were called
    expect(mockDailyFilterInstance.processDailyFilter).toHaveBeenCalledTimes(1);
    expect(mockMealPlanInstance.processMealPlan).toHaveBeenCalledTimes(1);
    expect(mockMealPlanInstance.getProjectInfo).toHaveBeenCalledTimes(1);

    // Check response structure
    expect(responseData.data.results.dailyFilter.success).toBe(true);
    expect(responseData.data.results.mealPlan.success).toBe(true);
    
    expect(responseData.data.results.dailyFilter.data.day).toBe('viernes');
    expect(responseData.data.results.mealPlan.data.nextDay).toBe('sábado');

    expect(logger.info).toHaveBeenCalledWith('Cron job daily tasks execution started');
  });

  it('should handle when both services fail', async () => {
    const mockDailyFilterInstance = {
      processDailyFilter: jest.fn().mockResolvedValue({
        success: false,
        error: 'Daily filter error',
        day: '',
        sectionId: null,
        sectionName: null,
        tasksCount: 0,
        tasks: [],
        projectId: ''
      })
    };

    const mockMealPlanInstance = {
      processMealPlan: jest.fn().mockResolvedValue({
        success: false,
        error: 'Meal plan error',
        currentDay: '',
        nextDay: '',
        sectionId: null,
        sectionName: null,
        tasksCount: 0,
        tasks: [],
        projectId: ''
      }),
      getProjectInfo: jest.fn().mockResolvedValue(null)
    };

    MockedDailyFilterService.mockImplementation(() => mockDailyFilterInstance as unknown as DailyFilterService);
    MockedMealPlanService.mockImplementation(() => mockMealPlanInstance as unknown as MealPlanService);

    const response = await GET(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.success).toBe(false);
    expect(responseData.error.message).toContain('Daily Filter: Daily filter error');
    expect(responseData.error.message).toContain('Meal Plan: Meal plan error');

    expect(logger.error).toHaveBeenCalledWith('Cron job partial failure', expect.objectContaining({
      dailyFilterSuccess: false,
      mealPlanSuccess: false
    }));
  });

  it('should handle unexpected errors', async () => {
    MockedDailyFilterService.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const response = await GET(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.success).toBe(false);
    expect(responseData.error.message).toBe('Error en ejecución del cron job');

    expect(logger.error).toHaveBeenCalledWith('Error in cron job daily tasks execution', expect.objectContaining({
      error: expect.any(Error)
    }));
  });
});
