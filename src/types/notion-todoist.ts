// Interfaces para la integración Notion-Todoist basadas en la documentación oficial

export interface NotionWebhookPayload {
  // Campos de verificación
  verification_token?: string;  // Para verificación inicial del endpoint
  
  // Campos de eventos reales (formato actual de la documentación)
  id?: string;                  // ID único del evento
  timestamp?: string;           // Timestamp del evento
  workspace_id?: string;        // ID del workspace
  workspace_name?: string;      // Nombre del workspace
  subscription_id?: string;     // ID de la suscripción
  integration_id?: string;      // ID de la integración
  type?: string;               // Tipo de evento (page.created, page.content_updated, etc.)
  attempt_number?: number;      // Número de intento de entrega
  
  // Autores del cambio
  authors?: Array<{
    id: string;
    type: string;
  }>;
  
  // Entidad afectada (página, base de datos, etc.)
  entity?: {
    id: string;
    type: string;  // "page", "database", "comment", etc.
  };
  
  // Datos adicionales del evento
  data?: {
    parent?: {
      id: string;
      type: string;
    };
    updated_blocks?: Array<{
      id: string;
      type: string;
    }>;
  };
  
  // Campos legacy para retrocompatibilidad
  object?: string;              
  event_ts?: string;            
  event_id?: string;            
  event_type?: string;          
  user_id?: string;            
  
  // Para retrocompatibilidad con formatos anteriores
  page?: {
    id: string;
    created_time: string;
    last_edited_time: string;
    created_by: {
      object: string;
      id: string;
    };
    last_edited_by: {
      object: string;
      id: string;
    };
    cover?: unknown;
    icon?: unknown;
    parent: {
      type: string;
      database_id?: string;
      page_id?: string;
    };
    archived: boolean;
    properties: {
      [key: string]: unknown;
    };
    url: string;
    public_url?: string;
  };
  
  properties?: {
    [key: string]: unknown;
  };
}

// Interfaces para Todoist Webhooks
export interface TodoistWebhookPayload {
  event_name: string;           // Tipo de evento: item:completed, item:added, etc.
  user_id: string;             // ID del usuario que ejecutó la acción
  event_data: TodoistEventData; // Datos del evento específico
  initiator: TodoistInitiator;  // Usuario que inició la acción
  triggered_at: string;        // Timestamp del evento
  version: string;             // Versión del webhook
  event_data_extra?: {         // Información extra opcional
    old_item?: TodoistEventData;
    update_intent?: string;    // item_updated, item_completed, item_uncompleted
  };
}

export interface TodoistEventData {
  id: string;                  // ID de la tarea
  content: string;             // Contenido/título de la tarea
  description: string;         // Descripción de la tarea
  project_id: string;          // ID del proyecto
  section_id?: string | null;  // ID de la sección
  parent_id?: string | null;   // ID de la tarea padre
  order: number;               // Orden de la tarea
  labels: string[];            // Labels/etiquetas
  priority: number;            // Prioridad (1-4)
  due?: {                      // Fecha de vencimiento
    date: string;
    timezone?: string;
    string: string;
    lang: string;
    is_recurring: boolean;
  } | null;
  url: string;                 // URL de la tarea en Todoist
  comment_count: number;       // Número de comentarios
  created_at: string;          // Fecha de creación
  creator_id: string;          // ID del creador
  assignee_id?: string | null; // ID del asignado
  assigner_id?: string | null; // ID del que asignó
  is_completed: boolean;       // Si está completada
  completed_at?: string | null;// Fecha de completado
  added_at: string;           // Fecha de adición
  added_by_uid: string;       // ID del usuario que agregó
  assigned_by_uid?: string | null; // ID del usuario que asignó
  responsible_uid?: string | null; // ID del responsable
  checked: boolean;           // Si está marcada como completada
  child_order: number;        // Orden entre tareas hijas
  collapsed: boolean;         // Si está colapsada
  deadline?: string | null;   // Fecha límite
  is_deleted: boolean;        // Si está eliminada
  user_id: string;           // ID del usuario
}

export interface TodoistInitiator {
  email: string;              // Email del usuario
  full_name: string;          // Nombre completo
  id: string;                // ID del usuario
  image_id?: string;         // ID de la imagen de perfil
  is_premium: boolean;       // Si es usuario premium
}

export interface TodoistTask {
  content: string;
  description?: string;
  project_id?: string;
  section_id?: string;
  parent_id?: string;
  order?: number;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_datetime?: string;
  due_lang?: string;
  assignee_id?: string;
}

export interface TodoistCreateTaskResponse {
  id: string;
  assigner_id?: string;
  assignee_id?: string;
  project_id: string;
  section_id?: string;
  parent_id?: string;
  order: number;
  content: string;
  description: string;
  is_completed: boolean;
  labels: string[];
  priority: number;
  comment_count: number;
  is_shared: boolean;
  created_at: string;
  due?: {
    date: string;
    is_recurring: boolean;
    datetime?: string;
    string: string;
    timezone?: string;
  };
  url: string;
}

export interface NotionPageContent {
  title: string;
  content: string;
  url: string;
  priority?: number;
  dueDate?: string;
  assignee?: string;
  tags?: string[];
}

export interface OpenAIEnhancement {
  enhancedTitle: string;
  enhancedDescription: string;
  suggestedPriority: number;
  suggestedLabels: string[];
  suggestedDueDate?: string;
}

export interface ProcessingResult {
  success: boolean;
  todoistTaskId?: string;
  taskId?: string;  // Alias para todoistTaskId
  notionPageId?: string;
  enhancedWithAI?: boolean;
  action?: 'created' | 'updated' | 'completed';
  title?: string;
  message?: string;
  error?: string;
}
