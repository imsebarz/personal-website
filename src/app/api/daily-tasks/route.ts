import { NextResponse } from 'next/server';
import { DailyFilterService } from '@/services/daily-filter.service';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { withErrorHandler } from '@/middleware/error-handler';
import { logger } from '@/lib/logger';

/**
 * API endpoint específico para Vercel Cron Jobs
 * Ejecuta el filtro dinámico diariamente en la mañana
 * 
 * Esta función será llamada automáticamente por Vercel según la configuración de cron
 * definida en vercel.json
 */
export const GET = withErrorHandler(async () => {
  try {


    logger.info('Cron job daily filter execution started');

    const service = new DailyFilterService();
    const result = await service.processDailyFilter();

    if (!result.success) {
      logger.error('Cron job daily filter failed', { error: result.error });
      const errorResponse = createErrorResponse(result.error || 'Cron job failed');
      return NextResponse.json(errorResponse, { status: 500 });
    }

    logger.info('Cron job daily filter completed successfully', {
      day: result.day,
      sectionName: result.sectionName,
      tasksCount: result.tasksCount,
      executedAt: new Date().toISOString()
    });

    const successResponse = createSuccessResponse({
      message: `Cron job ejecutado exitosamente para ${result.day}`,
      executedAt: new Date().toISOString(),
      cronJob: true,
      data: {
        day: result.day,
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
          processed: result.tasksCount
        },
        project: {
          id: result.projectId
        }
      }
    });

    return NextResponse.json(successResponse);

  } catch (error) {
    logger.error('Error in cron job daily filter execution', { error });
    const errorResponse = createErrorResponse('Error en ejecución del cron job');
    return NextResponse.json(errorResponse, { status: 500 });
  }
});
