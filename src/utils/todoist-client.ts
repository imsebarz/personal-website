import axios from 'axios';
import { TodoistTask, TodoistCreateTaskResponse } from '@/types/notion-todoist';

const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';

export async function createTodoistTask(task: TodoistTask): Promise<TodoistCreateTaskResponse> {
  try {
    const response = await axios.post<TodoistCreateTaskResponse>(
      `${TODOIST_API_URL}/tasks`,
      task,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TODOIST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Error de Todoist: ${error.response?.status} - ${error.response?.data}`);
    }
    throw new Error('Error desconocido al crear tarea en Todoist');
  }
}

export async function updateTodoistTask(taskId: string, updates: Partial<TodoistTask>): Promise<void> {
  try {
    await axios.post(
      `${TODOIST_API_URL}/tasks/${taskId}`,
      updates,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TODOIST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Error actualizando tarea en Todoist: ${error.response?.status} - ${error.response?.data}`);
    }
    throw new Error('Error desconocido al actualizar tarea en Todoist');
  }
}

export async function completeTodoistTask(taskId: string): Promise<void> {
  try {
    await axios.post(
      `${TODOIST_API_URL}/tasks/${taskId}/close`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.TODOIST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Error completando tarea en Todoist: ${error.response?.status} - ${error.response?.data}`);
    }
    throw new Error('Error desconocido al completar tarea en Todoist');
  }
}

export async function deleteTodoistTask(taskId: string): Promise<void> {
  try {
    await axios.delete(
      `${TODOIST_API_URL}/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TODOIST_API_TOKEN}`,
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Error eliminando tarea en Todoist: ${error.response?.status} - ${error.response?.data}`);
    }
    throw new Error('Error desconocido al eliminar tarea en Todoist');
  }
}

export async function findTaskByNotionUrl(notionPageId: string, projectId?: string): Promise<TodoistCreateTaskResponse | null> {
  try {
    const params: Record<string, string> = {};
    if (projectId) {
      params.project_id = projectId;
    }

    const response = await axios.get<TodoistCreateTaskResponse[]>(
      `${TODOIST_API_URL}/tasks`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TODOIST_API_TOKEN}`,
        },
        params,
      }
    );

    // Buscar tarea que contenga el pageId de Notion en la descripción
    // Buscar el ID de página de Notion sin guiones (formato limpio) y con guiones
    const cleanPageId = notionPageId.replace(/-/g, '');
    
    const task = response.data.find(task => {
      if (!task.description) return false;
      
      // Buscar en múltiples formatos:
      // 1. URL completa con notion.so
      // 2. URL completa con www.notion.so  
      // 3. Solo el pageId con guiones
      // 4. Solo el pageId sin guiones (clean)
      return task.description.includes(`notion.so/${notionPageId}`) ||
             task.description.includes(`www.notion.so/${notionPageId}`) ||
             task.description.includes(`notion.so/${cleanPageId}`) ||
             task.description.includes(`www.notion.so/${cleanPageId}`) ||
             task.description.includes(notionPageId) ||
             task.description.includes(cleanPageId);
    });

    return task || null;
  } catch (error) {
    console.error('Error buscando tarea en Todoist:', error);
    return null;
  }
}

export async function getProjects(): Promise<Array<{ id: string; name: string }>> {
  try {
    const response = await axios.get(`${TODOIST_API_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${process.env.TODOIST_API_TOKEN}`,
      },
    });

    return response.data.map((project: { id: string; name: string }) => ({
      id: project.id,
      name: project.name,
    }));
  } catch (_error) {
    return [];
  }
}

/**
 * Encuentra o crea un proyecto de Todoist basado en el nombre del workspace
 */
export async function findOrCreateProjectByWorkspace(workspaceName: string): Promise<string> {
  try {
    // Usar el nombre del workspace directamente como nombre de proyecto
    
    // Buscar proyecto existente
    const projects = await getProjects();
    const existingProject = projects.find(project => 
      project.name.toLowerCase() === workspaceName.toLowerCase()
    );
    
    if (existingProject) {
      return existingProject.id;
    }
    
    // Crear nuevo proyecto si no existe
    const newProject = await createTodoistProject(workspaceName);
    return newProject.id;
  } catch (error) {
    console.warn('Error managing Todoist project, falling back to default:', error);
    // Si hay error, usar el proyecto por defecto si está configurado
    return process.env.TODOIST_PROJECT_ID || '';
  }
}

/**
 * Crea un nuevo proyecto en Todoist
 */
export async function createTodoistProject(name: string): Promise<{ id: string; name: string }> {
  try {
    const response = await axios.post(
      `${TODOIST_API_URL}/projects`,
      { name },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TODOIST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.id,
      name: response.data.name,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Error creando proyecto en Todoist: ${error.response?.status} - ${error.response?.data}`);
    }
    throw new Error('Error desconocido al crear proyecto en Todoist');
  }
}

export function formatDateForTodoist(date: string): string {
  // Convierte fecha ISO a formato que entiende Todoist
  const dateObj = new Date(date);
  return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
}
