import { NextRequest, NextResponse } from 'next/server';
import { DailyFilterService } from '@/services/daily-filter.service';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { withErrorHandler } from '@/middleware/error-handler';
import { logger } from '@/lib/logger';

/**
 * API endpoint para obtener las tareas del día actual
 * Ejecuta el filtro dinámico que busca la sección correspondiente al día de la semana
 */
export const GET = withErrorHandler(async (_request: NextRequest) => {
  try {
    logger.info('Processing daily filter request');

    const service = new DailyFilterService();
    const result = await service.processDailyFilter();

    if (!result.success) {
      const errorResponse = createErrorResponse(result.error || 'Error processing daily filter');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    logger.info('Daily filter completed successfully', {
      day: result.day,
      sectionName: result.sectionName,
      tasksCount: result.tasksCount
    });

    const successResponse = createSuccessResponse({
      message: `Filtro del día ${result.day} procesado exitosamente`,
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
          items: result.tasks.map(task => ({
            id: task.id,
            content: task.content,
            description: task.description,
            due: task.due
          }))
        },
        project: {
          id: result.projectId
        }
      }
    });

    return NextResponse.json(successResponse);

  } catch (error) {
    logger.error('Error in daily filter endpoint', { error });
    const errorResponse = createErrorResponse('Error interno del servidor');
    return NextResponse.json(errorResponse, { status: 500 });
  }
});

/**
 * API endpoint para ejecutar manualmente el filtro dinámico
 * Permite forzar la ejecución sin esperar el cronjob
 */
export const POST = withErrorHandler(async (_request: NextRequest) => {
  try {
    logger.info('Manual daily filter execution triggered');

    const service = new DailyFilterService();
    
    // Obtener información del proyecto
    const projectInfo = await service.getProjectInfo();
    
    // Ejecutar el filtro
    const result = await service.processDailyFilter();

    if (!result.success) {
      const errorResponse = createErrorResponse(result.error || 'Error executing daily filter');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    logger.info('Manual daily filter executed successfully', {
      day: result.day,
      sectionName: result.sectionName,
      tasksCount: result.tasksCount
    });

    const successResponse = createSuccessResponse({
      message: `Filtro manual ejecutado para ${result.day}`,
      executedAt: new Date().toISOString(),
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
          items: result.tasks.map(task => ({
            id: task.id,
            content: task.content,
            description: task.description,
            due: task.due
          }))
        },
        project: {
          id: result.projectId,
          name: projectInfo?.name || 'Unknown'
        }
      }
    });

    return NextResponse.json(successResponse);

  } catch (error) {
    logger.error('Error in manual daily filter execution', { error });
    const errorResponse = createErrorResponse('Error ejecutando filtro manual');
    return NextResponse.json(errorResponse, { status: 500 });
  }
});
