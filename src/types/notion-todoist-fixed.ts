// Interfaces para la integración Notion-Todoist basadas en la documentación oficial

export interface NotionWebhookPayload {
  // Campos de verificación
  verification_token?: string;  // Para verificación inicial del endpoint
  
  // Campos de eventos reales
  object?: string;              // "page", "database", "comment", etc.
  event_ts?: string;            // Timestamp del evento
  event_id?: string;            // ID único del evento
  event_type?: string;          // Tipo de evento (page.content_updated, etc.)
  subscription_id?: string;     // ID de la suscripción
  user_id?: string;            // ID del usuario que causó el evento
  workspace_id?: string;       // ID del workspace
  
  // Entidad afectada (página, base de datos, etc.)
  entity?: {
    object: string;
    id: string;
  };
  
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
  notionPageId?: string;
  enhancedWithAI?: boolean;
  error?: string;
}
