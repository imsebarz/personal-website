
import { logger } from '@/lib/logger';
import { generateUUID, generateTempId } from '@/utils/uuid-helpers';
import { getCurrentDayNameInColombia, getCurrentDateInColombia } from '@/utils/colombia-timezone';

interface TodoistSection {
  id: string;
  name: string;
  project_id: string;
}

interface TodoistTask {
  id: string;
  content: string;
  description: string;
  section_id: string;
  project_id: string;
  is_completed: boolean;
  due?: {
    date: string;
    string: string;
  };
}

interface DailyFilterResult {
  success: boolean;
  day: string;
  sectionId: string | null;
  sectionName: string | null;
  tasksCount: number;
  tasks: TodoistTask[];
  projectId: string;
  filterId?: string;
  filterQuery?: string;
  filterUpdated?: boolean;
  error?: string;
}

export class DailyFilterService {
  private readonly apiUrl = 'https://api.todoist.com/rest/v2';
  private readonly token: string;
  private readonly projectId: string;
  private readonly filterName: string;

  constructor() {
    this.token = process.env.TODOIST_API_TOKEN_DAILY || process.env.TODOIST_API_TOKEN || '';
    this.projectId = process.env.TODOIST_DAILY_PROJECT_ID || '';
    this.filterName = process.env.TODOIST_DAILY_FILTER_NAME || 'Alimentacion del día';
    
    logger.info('DailyFilterService constructor', {
      hasToken: !!this.token,
      hasProjectId: !!this.projectId,
      filterName: this.filterName,
      tokenSource: process.env.TODOIST_API_TOKEN_DAILY ? 'DAILY' : 'DEFAULT'
    });
    
    if (!this.token) throw new Error('TODOIST_API_TOKEN_DAILY or TODOIST_API_TOKEN is required');
    if (!this.projectId) throw new Error('TODOIST_DAILY_PROJECT_ID is required');
  }

  private getCurrentDayName(): string {
    return getCurrentDayNameInColombia();
  }

  private async getSections(): Promise<TodoistSection[]> {
    const response = await fetch(`${this.apiUrl}/sections?project_id=${this.projectId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error(`Failed to fetch sections: ${response.status} - ${response.statusText}`);
    return await response.json();
  }

  private findSectionByDay(sections: TodoistSection[], dayName: string): TodoistSection | null {
    return sections.find(section => section.name.toLowerCase().includes(dayName.toLowerCase())) || null;
  }

  private async getTasksFromSection(sectionId: string): Promise<TodoistTask[]> {
    const response = await fetch(`${this.apiUrl}/tasks?project_id=${this.projectId}&section_id=${sectionId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.status} - ${response.statusText}`);
    return await response.json();
  }

  /**
   * Crea o actualiza el filtro nativo usando la API Sync v1
   */
  private async syncV1CreateOrUpdateFilter(sectionName: string): Promise<{ filterId: string; filterQuery: string; updated: boolean }> {
    const filterName = this.filterName;
    // Obtener el nombre del proyecto
    const projectInfo = await this.getProjectInfo();
    const projectName = projectInfo?.name || '';
    // El filtro debe ser #proyecto & /Seccion
    const filterQuery = `#${projectName} & /${sectionName} & !subtask`;
    const syncUrl = 'https://api.todoist.com/sync/v9/sync';
    // 1. Obtener todos los filtros
    const getRes = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sync_token: '*',
        resource_types: '["filters"]'
      })
    });
    if (!getRes.ok) throw new Error('No se pudo obtener filtros (Sync v1)');
    const getData = await getRes.json();
    const filters = getData.filters || [];
    interface TodoistFilter {
      id: string;
      name: string;
      query: string;
      color?: string;
      favorite?: boolean;
    }
    const existing = filters.find((f: TodoistFilter) => f.name === filterName);
    if (existing) {
      if (existing.query === filterQuery) {
        return { filterId: existing.id, filterQuery, updated: false };
      }
      // Actualizar filtro
      const updateRes = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sync_token: '*',
          commands: [
            {
              type: 'filter_update',
              uuid: generateUUID(),
              args: {
                id: existing.id,
                name: filterName,
                query: filterQuery,
                color: existing.color || 'blue',
                favorite: true
              }
            }
          ]
        })
      });
      if (!updateRes.ok) throw new Error('No se pudo actualizar el filtro (Sync v1)');
      return { filterId: existing.id, filterQuery, updated: true };
    } else {
      // Crear filtro
      const addRes = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sync_token: '*',
          commands: [
            {
              type: 'filter_add',
              uuid: generateUUID(),
              temp_id: generateTempId(),
              args: {
                name: filterName,
                query: filterQuery,
                color: 'blue',
                favorite: true
              }
            }
          ]
        })
      });
      if (!addRes.ok) throw new Error('No se pudo crear el filtro (Sync v1)');
      // No retorna el id directamente, así que hay que volver a consultar
      const getRes2 = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sync_token: '*',
          resource_types: '["filters"]'
        })
      });
      const getData2 = await getRes2.json();
      const created = (getData2.filters || []).find((f: TodoistFilter) => f.name === filterName && f.query === filterQuery);
      return { filterId: created?.id || '', filterQuery, updated: true };
    }
  }

  async processDailyFilter(): Promise<DailyFilterResult> {
    try {
      const currentDay = this.getCurrentDayName();
      logger.info('Processing daily filter', { 
        day: currentDay, 
        projectId: this.projectId,
        utcTime: new Date().toISOString(),
        colombiaTime: getCurrentDateInColombia().toISOString()
      });
      const sections = await this.getSections();
      logger.info('Sections found', { sectionsCount: sections.length, sections: sections.map(s => s.name) });
      const daySection = this.findSectionByDay(sections, currentDay);
      if (!daySection) {
        logger.warn('No section found for current day', { day: currentDay, availableSections: sections.map(s => s.name) });
        return {
          success: false,
          day: currentDay,
          sectionId: null,
          sectionName: null,
          tasksCount: 0,
          tasks: [],
          projectId: this.projectId,
          error: `No se encontró sección para el día: ${currentDay}`
        };
      }
      // Crear o actualizar el filtro nativo usando Sync v1
      const filterResult = await this.syncV1CreateOrUpdateFilter(daySection.name);
      const tasks = await this.getTasksFromSection(daySection.id);
      const activeTasks = tasks.filter((task: TodoistTask) => !task.is_completed);
      logger.info('Daily filter processed successfully', {
        day: currentDay,
        sectionName: daySection.name,
        totalTasks: tasks.length,
        activeTasks: activeTasks.length,
        filterId: filterResult.filterId,
        filterUpdated: filterResult.updated
      });
      return {
        success: true,
        day: currentDay,
        sectionId: daySection.id,
        sectionName: daySection.name,
        tasksCount: activeTasks.length,
        tasks: activeTasks,
        projectId: this.projectId,
        filterId: filterResult.filterId,
        filterQuery: filterResult.filterQuery,
        filterUpdated: filterResult.updated
      };
    } catch (error) {
      logger.error('Error processing daily filter', { error });
      return {
        success: false,
        day: this.getCurrentDayName(),
        sectionId: null,
        sectionName: null,
        tasksCount: 0,
        tasks: [],
        projectId: this.projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getProjectInfo(): Promise<{ id: string; name: string } | null> {
    try {
      const response = await fetch(`${this.apiUrl}/projects/${this.projectId}`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch project: ${response.status} - ${response.statusText}`);
      return await response.json();
    } catch (error) {
      logger.error('Error fetching project info', { error, projectId: this.projectId });

      return null;
    }
  }
}
