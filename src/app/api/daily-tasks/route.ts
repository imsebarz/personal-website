import { NextResponse } from 'next/server';
import { DailyFilterService } from '@/services/daily-filter.service';
import { MealPlanService } from '@/services/meal-plan.service';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { withErrorHandler } from '@/middleware/error-handler';
import { logger } from '@/lib/logger';

/**
 * API endpoint específico para Vercel Cron Jobs
 * Ejecuta el filtro dinámico diariamente y el meal plan en la mañana
 * 
 * Esta función será llamada automáticamente por Vercel según la configuración de cron
 * definida en vercel.json
 */
export const GET = withErrorHandler(async () => {
  try {
    logger.info('Cron job daily tasks execution started');

    // Ejecutar servicio de daily filter
    const dailyFilterService = new DailyFilterService();
    const dailyFilterResult = await dailyFilterService.processDailyFilter();

    // Ejecutar servicio de meal plan
    const mealPlanService = new MealPlanService();
    const mealPlanResult = await mealPlanService.processMealPlan();

    // Verificar si alguno falló
    const hasErrors = !dailyFilterResult.success || !mealPlanResult.success;

    if (hasErrors) {
      const errors = [];
      if (!dailyFilterResult.success) {
        errors.push(`Daily Filter: ${dailyFilterResult.error}`);
      }
      if (!mealPlanResult.success) {
        errors.push(`Meal Plan: ${mealPlanResult.error}`);
      }
      
      logger.error('Cron job partial failure', { 
        dailyFilterSuccess: dailyFilterResult.success,
        mealPlanSuccess: mealPlanResult.success,
        errors 
      });

      // Si ambos fallan, retornar error 500
      if (!dailyFilterResult.success && !mealPlanResult.success) {
        const errorResponse = createErrorResponse(errors.join('; '));
        return NextResponse.json(errorResponse, { status: 500 });
      }
    }

    logger.info('Cron job daily tasks completed', {
      dailyFilter: {
        success: dailyFilterResult.success,
        day: dailyFilterResult.day,
        sectionName: dailyFilterResult.sectionName,
        tasksCount: dailyFilterResult.tasksCount
      },
      mealPlan: {
        success: mealPlanResult.success,
        currentDay: mealPlanResult.currentDay,
        nextDay: mealPlanResult.nextDay,
        tasksCount: mealPlanResult.tasksCount
      },
      executedAt: new Date().toISOString()
    });

    const successResponse = createSuccessResponse({
      message: 'Cron job diario ejecutado exitosamente',
      executedAt: new Date().toISOString(),
      cronJob: true,
      results: {
        dailyFilter: {
          success: dailyFilterResult.success,
          data: dailyFilterResult.success ? {
            day: dailyFilterResult.day,
            section: {
              id: dailyFilterResult.sectionId,
              name: dailyFilterResult.sectionName
            },
            filter: {
              id: dailyFilterResult.filterId,
              query: dailyFilterResult.filterQuery,
              updated: dailyFilterResult.filterUpdated
            },
            tasks: {
              count: dailyFilterResult.tasksCount,
              processed: dailyFilterResult.tasksCount
            },
            project: {
              id: dailyFilterResult.projectId
            }
          } : { error: dailyFilterResult.error }
        },
        mealPlan: {
          success: mealPlanResult.success,
          data: mealPlanResult.success ? {
            currentDay: mealPlanResult.currentDay,
            nextDay: mealPlanResult.nextDay,
            section: {
              id: mealPlanResult.sectionId,
              name: mealPlanResult.sectionName
            },
            filter: {
              id: mealPlanResult.filterId,
              query: mealPlanResult.filterQuery,
              updated: mealPlanResult.filterUpdated
            },
            tasks: {
              count: mealPlanResult.tasksCount,
              items: mealPlanResult.tasks.map(task => ({
                id: task.id,
                content: task.content,
                description: task.description,
                labels: task.labels,
                due: task.due
              }))
            },
            projectInfo: await mealPlanService.getProjectInfo()
          } : { error: mealPlanResult.error }
        }
      }
    });

    return NextResponse.json(successResponse);

  } catch (error) {
    logger.error('Error in cron job daily tasks execution', { error });
    const errorResponse = createErrorResponse('Error en ejecución del cron job');
    return NextResponse.json(errorResponse, { status: 500 });
  }
});
