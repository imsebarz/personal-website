import { NextRequest, NextResponse } from 'next/server';
import { MealPlanService } from '@/services/meal-plan.service';
import { withErrorHandler } from '@/middleware/error-handler';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  logger.info('Meal plan API endpoint called');

  try {
    const mealPlanService = new MealPlanService();
    const result = await mealPlanService.processMealPlan();

    if (!result.success) {
      logger.error('Meal plan processing failed', { result });
      const errorResponse = createErrorResponse(result.error || 'Error processing meal plan');
      return NextResponse.json(errorResponse, { status: 500 });
    }

    logger.info('Meal plan processed successfully', {
      currentDay: result.currentDay,
      nextDay: result.nextDay,
      tasksCount: result.tasksCount,
      filterUpdated: result.filterUpdated
    });

    const successResponse = createSuccessResponse({
      message: `Meal plan para ${result.nextDay} procesado exitosamente`,
      data: {
        currentDay: result.currentDay,
        nextDay: result.nextDay,
        section: {
          id: result.sectionId,
          name: result.sectionName
        },
        filter: {
          id: result.filterId,
          query: result.filterQuery,
          updated: result.filterUpdated
        },
        tasks: {
          count: result.tasksCount,
          items: result.tasks.map(task => ({
            id: task.id,
            content: task.content,
            description: task.description,
            labels: task.labels,
            due: task.due
          }))
        },
        projectInfo: await mealPlanService.getProjectInfo()
      }
    });

    return NextResponse.json(successResponse);
  } catch (error) {
    logger.error('Unexpected error in meal plan API', { error });
    const errorResponse = createErrorResponse('Internal server error');
    return NextResponse.json(errorResponse, { status: 500 });
  }
});
