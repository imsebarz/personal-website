import { logger } from '@/lib/logger';

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
  labels: string[];
  due?: {
    date: string;
    string: string;
  };
}

interface MealPlanResult {
  success: boolean;
  currentDay: string;
  nextDay: string;
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

export class MealPlanService {
  private readonly apiUrl = 'https://api.todoist.com/rest/v2';
  private readonly token: string;
  private readonly projectId: string;
  private readonly filterName: string;

  constructor() {
    this.token = process.env.TODOIST_API_TOKEN_MEAL_PLAN || process.env.TODOIST_API_TOKEN || '';
    this.projectId = process.env.TODOIST_MEAL_PLAN_PROJECT_ID || process.env.TODOIST_DAILY_PROJECT_ID || '';
    this.filterName = process.env.TODOIST_MEAL_PLAN_FILTER_NAME || 'Meal Plan del día siguiente';
    
    if (!this.token) throw new Error('TODOIST_API_TOKEN_MEAL_PLAN or TODOIST_API_TOKEN is required');
    if (!this.projectId) throw new Error('TODOIST_MEAL_PLAN_PROJECT_ID or TODOIST_DAILY_PROJECT_ID is required');
  }

  private getCurrentDayName(): string {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[new Date().getDay()];
  }

  private getNextDayName(): string {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return days[tomorrow.getDay()];
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

  private filterMealPlanTasks(tasks: TodoistTask[]): TodoistTask[] {
    return tasks.filter(task => 
      !task.is_completed && 
      task.labels.some(label => label.toLowerCase().includes('mealprep'))
    );
  }

  /**
   * Crea o actualiza el filtro nativo para meal plan del día siguiente usando la API Sync v9
   */
  private async syncV9CreateOrUpdateFilter(sectionName: string): Promise<{ filterId: string; filterQuery: string; updated: boolean }> {
    const filterName = this.filterName;
    
    // Obtener el nombre del proyecto
    const projectInfo = await this.getProjectInfo();
    const projectName = projectInfo?.name || '';
    
    // El filtro debe ser #proyecto & /Seccion & @mealprep
    const filterQuery = `#${projectName} & /${sectionName} & @mealprep`;
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

    if (!getRes.ok) throw new Error('No se pudo obtener filtros (Sync v9)');
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
              uuid: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
              args: {
                id: existing.id,
                name: filterName,
                query: filterQuery,
                color: existing.color || 'green',
                favorite: true
              }
            }
          ]
        })
      });

      if (!updateRes.ok) throw new Error('No se pudo actualizar el filtro (Sync v9)');
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
              uuid: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
              temp_id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
              args: {
                name: filterName,
                query: filterQuery,
                color: 'green',
                favorite: true
              }
            }
          ]
        })
      });

      if (!addRes.ok) throw new Error('No se pudo crear el filtro (Sync v9)');

      // Volver a consultar para obtener el filtro creado
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

  async processMealPlan(): Promise<MealPlanResult> {
    try {
      const currentDay = this.getCurrentDayName();
      const nextDay = this.getNextDayName();
      
      logger.info('Processing meal plan for next day', { 
        currentDay, 
        nextDay, 
        projectId: this.projectId 
      });

      const sections = await this.getSections();
      logger.info('Sections found', { 
        sectionsCount: sections.length, 
        sections: sections.map(s => s.name) 
      });

      const nextDaySection = this.findSectionByDay(sections, nextDay);
      if (!nextDaySection) {
        logger.warn('No section found for next day', { 
          nextDay, 
          availableSections: sections.map(s => s.name) 
        });
        return {
          success: false,
          currentDay,
          nextDay,
          sectionId: null,
          sectionName: null,
          tasksCount: 0,
          tasks: [],
          projectId: this.projectId,
          error: `No se encontró sección para el día siguiente: ${nextDay}`
        };
      }

      // Crear o actualizar el filtro nativo usando Sync v9
      const filterResult = await this.syncV9CreateOrUpdateFilter(nextDaySection.name);

      const allTasks = await this.getTasksFromSection(nextDaySection.id);
      const mealPlanTasks = this.filterMealPlanTasks(allTasks);

      logger.info('Meal plan processed successfully', {
        currentDay,
        nextDay,
        sectionName: nextDaySection.name,
        totalTasks: allTasks.length,
        mealPlanTasks: mealPlanTasks.length,
        filterId: filterResult.filterId,
        filterUpdated: filterResult.updated
      });

      return {
        success: true,
        currentDay,
        nextDay,
        sectionId: nextDaySection.id,
        sectionName: nextDaySection.name,
        tasksCount: mealPlanTasks.length,
        tasks: mealPlanTasks,
        projectId: this.projectId,
        filterId: filterResult.filterId,
        filterQuery: filterResult.filterQuery,
        filterUpdated: filterResult.updated
      };
    } catch (error) {
      logger.error('Error processing meal plan', { error });
      return {
        success: false,
        currentDay: this.getCurrentDayName(),
        nextDay: this.getNextDayName(),
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
