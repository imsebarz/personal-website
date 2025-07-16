/**
 * Servicio para la integración Notion-Todoist
 */

import { ProcessingResult, TodoistCreateTaskResponse } from '@/types/notion-todoist';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import { getNotionPageContent, getNotionPageStatus } from '@/utils/notion-client';
import { 
  createTodoistTask, 
  updateTodoistTask, 
  findTaskByNotionUrl, 
  formatDateForTodoist, 
  completeTodoistTask,
  deleteTodoistTask 
} from '@/utils/todoist-client';
import { enhanceTaskWithAI } from '@/utils/openai-client';
import { createWorkspaceTag, combineTagsWithWorkspace } from '@/utils/tag-helpers';

export class NotionTodoistService {
  
  /**
   * Maneja la eliminación de una tarea cuando se quita la mención del usuario
   */
  async handleMentionRemoval(pageId: string): Promise<{
    taskDeleted: boolean;
    taskId?: string;
    error?: string;
  }> {
    try {
      logger.info('Checking for existing Todoist task to delete', { pageId });
      
      // Buscar tarea existente en Todoist
      const existingTask = await findTaskByNotionUrl(pageId, config.todoist.projectId);
      
      if (!existingTask) {
        logger.info('No existing task found for mention removal', { pageId });
        return { taskDeleted: false };
      }
      
      logger.info('Found existing task, proceeding with deletion', { 
        pageId,
        taskId: existingTask.id 
      });
      
      // Eliminar la tarea de Todoist
      await deleteTodoistTask(existingTask.id);
      
      logger.info('Task successfully deleted from Todoist due to mention removal', { 
        pageId,
        taskId: existingTask.id 
      });
      
      return { 
        taskDeleted: true, 
        taskId: existingTask.id 
      };
    } catch (error) {
      logger.error('Error handling mention removal', error as Error, { pageId });
      return {
        taskDeleted: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Procesa una página de Notion y crea/actualiza tarea en Todoist
   */
  async processPage(
    pageId: string, 
    workspaceName?: string, 
    action: 'create' | 'update' = 'create'
  ): Promise<ProcessingResult> {
    try {
      logger.info(`${action === 'update' ? 'Updating' : 'Creating'} task for page`, { 
        pageId, 
        action, 
        workspaceName 
      });
      
      // Si es una actualización, buscar tarea existente
      if (action === 'update') {
        const existingTask = await findTaskByNotionUrl(pageId, config.todoist.projectId);
        if (existingTask) {
          logger.info('Existing task found', { taskId: existingTask.id, pageId });
          return await this.updateExistingTask(existingTask, pageId, workspaceName);
        } else {
          logger.info('No existing task found, creating new task', { pageId });
          // Si no encuentra la tarea existente, crear una nueva
          action = 'create';
        }
      }

      // Crear nueva tarea
      return await this.createNewTask(pageId, workspaceName);
    } catch (error) {
      logger.error('Error processing Notion page', error as Error, { pageId, action });
      return {
        success: false,
        notionPageId: pageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Crea una nueva tarea en Todoist
   */
  private async createNewTask(
    pageId: string, 
    workspaceName?: string
  ): Promise<ProcessingResult> {
    logger.info('Getting Notion page content', { pageId });
    const pageContent = await getNotionPageContent(pageId);

    let finalContent = pageContent;
    let enhancedWithAI = false;

    // Enriquecer con IA si está habilitado
    if (config.openai.enabled && config.openai.apiKey) {
      try {
        logger.info('Enhancing task with AI');
        const aiEnhancement = await enhanceTaskWithAI(pageContent);
        
        finalContent = {
          ...pageContent,
          title: pageContent.title, // Mantener título original, sin AI enhancement
          content: aiEnhancement.enhancedDescription,
          priority: aiEnhancement.suggestedPriority,
          tags: aiEnhancement.suggestedLabels,
          dueDate: aiEnhancement.suggestedDueDate || pageContent.dueDate,
        };
        
        enhancedWithAI = true;
        logger.info('Task enhanced with AI successfully (keeping original title)');
      } catch (aiError) {
        logger.warn('Error enhancing with AI, continuing without improvements', { 
          error: aiError 
        });
      }
    }

    logger.info('Creating task in Todoist');
    
    const { allTags, workspaceTag } = this.prepareTags(finalContent.tags, workspaceName);
    
    logger.info('Tags prepared for task', { 
      tags: allTags, 
      workspace: workspaceTag || 'none' 
    });
    
    const todoistTask = {
      content: finalContent.title,
      description: this.createTaskDescription(finalContent, workspaceName),
      project_id: config.todoist.projectId,
      priority: finalContent.priority || 2,
      labels: allTags,
      ...(finalContent.dueDate && {
        due_date: formatDateForTodoist(finalContent.dueDate),
      }),
    };

    const todoistResponse = await createTodoistTask(todoistTask);
    
    logger.info('Task created successfully in Todoist', { 
      taskId: todoistResponse.id,
      pageId 
    });

    return {
      success: true,
      todoistTaskId: todoistResponse.id,
      notionPageId: pageId,
      enhancedWithAI,
    };
  }

  /**
   * Actualiza una tarea existente en Todoist
   */
  private async updateExistingTask(
    existingTask: TodoistCreateTaskResponse, 
    pageId: string, 
    workspaceName?: string
  ): Promise<ProcessingResult> {
    logger.info('Getting updated Notion page content', { pageId });
    const pageContent = await getNotionPageContent(pageId);
    
    // Verificar el estado de la página
    logger.info('Checking page status');
    const pageStatus = await getNotionPageStatus(pageId);
    logger.info('Page status retrieved', { status: pageStatus });
    
    // Si el estado indica completado, completar la tarea en Todoist
    const completedStatuses = ['Listo', 'Done', 'Completed', 'Completado', 'Terminado', 'Finished'];
    if (pageStatus && completedStatuses.includes(pageStatus)) {
      return await this.completeTask(existingTask, pageId, pageStatus, pageContent);
    }

    // Actualizar tarea normal
    return await this.updateTaskContent(existingTask, pageId, pageContent, workspaceName);
  }

  /**
   * Completa una tarea en Todoist
   */
  private async completeTask(
    existingTask: TodoistCreateTaskResponse,
    pageId: string,
    pageStatus: string,
    pageContent: { title: string }
  ): Promise<ProcessingResult> {
    logger.info(`Page marked as "${pageStatus}" - completing task in Todoist`, {
      pageId,
      taskId: existingTask.id,
      status: pageStatus
    });
    
    try {
      await completeTodoistTask(existingTask.id);
      logger.info('Task completed successfully in Todoist', { 
        taskId: existingTask.id 
      });
      
      return {
        success: true,
        action: 'completed',
        taskId: existingTask.id,
        title: pageContent.title,
        message: `Task marked as completed in Todoist (status: ${pageStatus})`
      };
    } catch (error) {
      logger.error('Error completing task in Todoist', error as Error, {
        taskId: existingTask.id,
        pageId
      });
      // Continuar con actualización normal si no se puede completar
      const fullPageContent = await getNotionPageContent(pageId);
      return await this.updateTaskContent(existingTask, pageId, fullPageContent);
    }
  }

  /**
   * Actualiza el contenido de una tarea
   */
  private async updateTaskContent(
    existingTask: TodoistCreateTaskResponse,
    pageId: string,
    pageContent: { title: string; content: string; url: string; tags?: string[]; priority?: number; dueDate?: string },
    workspaceName?: string
  ): Promise<ProcessingResult> {
    let finalContent = pageContent;
    let enhancedWithAI = false;

    // Enriquecer con IA si está habilitado
    if (config.openai.enabled && config.openai.apiKey) {
      try {
        logger.info('Enhancing task update with AI');
        const aiEnhancement = await enhanceTaskWithAI(pageContent);
        
        finalContent = {
          ...pageContent,
          title: pageContent.title, // Mantener título original, sin AI enhancement
          content: aiEnhancement.enhancedDescription,
          priority: aiEnhancement.suggestedPriority,
          tags: aiEnhancement.suggestedLabels,
          dueDate: aiEnhancement.suggestedDueDate || pageContent.dueDate,
        };
        
        enhancedWithAI = true;
        logger.info('Task update enhanced with AI successfully (keeping original title)');
      } catch (aiError) {
        logger.warn('Error enhancing update with AI, continuing without improvements', {
          error: aiError
        });
      }
    }

    logger.info('Updating task in Todoist');
    
    const { allTags } = this.prepareTags(finalContent.tags, workspaceName);
    
    logger.info('Tags updated for task', { 
      tags: allTags,
      workspace: workspaceName || 'none'
    });
    
    const updates = {
      content: finalContent.title,
      description: this.createTaskDescription(finalContent, workspaceName),
      priority: finalContent.priority || 2,
      labels: allTags,
      ...(finalContent.dueDate && {
        due_date: formatDateForTodoist(finalContent.dueDate),
      }),
    };

    await updateTodoistTask(existingTask.id, updates);
    
    logger.info('Task updated successfully in Todoist', { 
      taskId: existingTask.id 
    });

    return {
      success: true,
      todoistTaskId: existingTask.id,
      notionPageId: pageId,
      enhancedWithAI,
    };
  }

  /**
   * Prepara las tags para la tarea
   */
  private prepareTags(
    contentTags: string[] | undefined, 
    workspaceName?: string
  ): { allTags: string[]; workspaceTag: string } {
    const baseTags = contentTags || ['notion'];
    const workspaceTag = workspaceName ? createWorkspaceTag(workspaceName) : '';
    const allTags = workspaceTag 
      ? combineTagsWithWorkspace(baseTags, workspaceTag)
      : baseTags;
    
    return { allTags, workspaceTag };
  }

  /**
   * Crea la descripción de la tarea
   */
  private createTaskDescription(content: { content: string; url: string }, workspaceName?: string): string {
    const baseDescription = `${content.content}\n\n🔗 Ver en Notion: ${content.url}`;
    return workspaceName 
      ? `${baseDescription}\n📁 Workspace: ${workspaceName}`
      : baseDescription;
  }
}
