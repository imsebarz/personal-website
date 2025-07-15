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
    console.error('Error al crear tarea en Todoist:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Error de Todoist: ${error.response?.status} - ${error.response?.data}`);
    }
    throw new Error('Error desconocido al crear tarea en Todoist');
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
  } catch (error) {
    console.error('Error al obtener proyectos de Todoist:', error);
    return [];
  }
}

export function formatDateForTodoist(date: string): string {
  // Convierte fecha ISO a formato que entiende Todoist
  const dateObj = new Date(date);
  return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
}
