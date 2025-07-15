import { NextRequest, NextResponse } from 'next/server';
import { NotionWebhookPayload, ProcessingResult } from '@/types/notion-todoist';
import { getNotionPageContent, isUserMentioned, getNotionPageStatus } from '@/utils/notion-client';
import { createTodoistTask, updateTodoistTask, findTaskByNotionUrl, formatDateForTodoist, completeTodoistTask } from '@/utils/todoist-client';
import { enhanceTaskWithAI } from '@/utils/openai-client';
import { 
  isValidNotionWebhook, 
  shouldProcessEvent,
  getEventAction
} from '@/utils/notion-webhook-validator';
import { createWorkspaceTag, combineTagsWithWorkspace } from '@/utils/tag-helpers';

const NOTION_USER_ID = process.env.NOTION_USER_ID;
const TODOIST_PROJECT_ID = process.env.TODOIST_PROJECT_ID; 
const ENABLE_AI_ENHANCEMENT = process.env.ENABLE_AI_ENHANCEMENT === 'true';

const recentlyProcessed = new Map<string, number>();
const pendingEvents = new Map<string, { 
  payload: NotionWebhookPayload, 
  workspaceName?: string, 
  timeoutId: NodeJS.Timeout 
}>();
const DEBOUNCE_TIME = 60000; // 60 segundos

export async function POST(request: NextRequest): Promise<NextResponse> {
  const _processingStartTime = Date.now();
  let _requestId: string | undefined;
  let payload: NotionWebhookPayload | undefined;
  let pageId: string | undefined;
  
  try {
    payload = await request.json();
    
    if (!payload) {
      throw new Error('Payload vacío o inválido');
    }
    
    if ('verification_token' in payload) {
      console.log('🔍 Verificación de Notion recibida:', payload.verification_token);
      
      console.log('� Token de verificación para validación de firmas:', payload.verification_token);
      
      return NextResponse.json({
        verification_token: payload.verification_token
      }, { status: 200 });
    }

    console.log('📋 Headers recibidos:', {
      'notion-version': request.headers.get('notion-version'),
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type'),
      'x-notion-signature': request.headers.get('x-notion-signature'),
    });

    const userAgent = request.headers.get('user-agent');
    const hasNotionSignature = !!request.headers.get('x-notion-signature');
    
    if (!isValidNotionWebhook(userAgent, hasNotionSignature)) {
      console.log('⚠️ Webhook no válido - no proviene de Notion');
      return NextResponse.json(
        { error: 'Webhook no válido - no proviene de Notion' },
        { status: 400 }
      );
    }

    console.log('📥 Webhook recibido:', JSON.stringify(payload, null, 2));

    // Verificar que es un evento de página
    pageId = payload.entity?.id || payload.page?.id;
    if (!pageId || (payload.entity?.type !== 'page' && !payload.page)) {
      return NextResponse.json(
        { message: 'Evento ignorado - no es una página' },
        { status: 200 }
      );
    }

    // Verificar si el evento debe ser procesado
    if (!shouldProcessEvent(payload.type)) {
      if (payload.type === 'page.deleted') {
        console.log(`🗑️ Página ${pageId} fue eliminada - ignorando evento`);
        return NextResponse.json(
          { message: 'Evento ignorado - página eliminada' },
          { status: 200 }
        );
      } else {
        console.log(`📭 Evento ${payload.type} ignorado - no relevante para crear tareas`);
        return NextResponse.json(
          { message: `Evento ${payload.type} ignorado` },
          { status: 200 }
        );
      }
    }

    // Implementar debounce que procesa el último evento (no el primero)
    const now = Date.now();
    const lastProcessed = recentlyProcessed.get(pageId);
    
    // Si ya existe un evento pendiente para esta página, cancelar el timeout anterior
    const existingPendingEvent = pendingEvents.get(pageId);
    if (existingPendingEvent) {
      clearTimeout(existingPendingEvent.timeoutId);
      console.log(`⏳ Cancelando evento anterior para página ${pageId}, actualizando con evento más reciente`);
    }
    
    // Si la página fue procesada recientemente, solo actualizar el evento pendiente
    if (lastProcessed && (now - lastProcessed) < DEBOUNCE_TIME) {
      console.log(`⏳ Página ${pageId} procesada hace ${Math.round((now - lastProcessed) / 1000)}s, programando procesamiento del evento más reciente`);
    } else {
      console.log(`⏳ Programando procesamiento para página ${pageId} en ${DEBOUNCE_TIME / 1000}s`);
    }
    
    // Crear nuevo timeout para procesar este evento (el más reciente)
    const timeoutId = setTimeout(async () => {
      try {
        console.log(`🔄 Procesando evento final para página ${pageId}`);
        
        // Remover de eventos pendientes
        if (pageId) {
          pendingEvents.delete(pageId);
          
          // Marcar como procesado
          recentlyProcessed.set(pageId, Date.now());
          
          // Verificar si el usuario está mencionado (si se configuró)
          if (NOTION_USER_ID) {
            const isMentioned = await isUserMentioned(pageId, NOTION_USER_ID);
            if (!isMentioned) {
              console.log('Usuario no mencionado en la página');
              return;
            }
          }
          
          // Procesar la página
          const eventAction = getEventAction(payload?.type);
          const result = await processNotionPage(pageId, payload?.workspace_name, eventAction);
          
          if (result.success) {
            const actionText = eventAction === 'update' ? 'actualizada' : 'procesada';
            console.log(`✅ Página ${pageId} ${actionText} exitosamente (evento final)`);
          } else {
            console.error(`❌ Error procesando página ${pageId}:`, result.error);
          }
        }
      } catch (error) {
        console.error(`❌ Error en procesamiento diferido para página ${pageId}:`, error);
        if (pageId) {
          pendingEvents.delete(pageId);
        }
      }
    }, DEBOUNCE_TIME);
    
    // Guardar el evento pendiente
    pendingEvents.set(pageId, {
      payload,
      workspaceName: payload.workspace_name,
      timeoutId
    });
    
    // Limpiar entradas antiguas de recentlyProcessed
    const entriesToDelete: string[] = [];
    recentlyProcessed.forEach((timestamp, id) => {
      if (now - timestamp > DEBOUNCE_TIME * 2) { // Mantener por más tiempo para evitar procesamiento múltiple
        entriesToDelete.push(id);
      }
    });
    entriesToDelete.forEach(id => recentlyProcessed.delete(id));
    
    // Retornar respuesta inmediata indicando que el evento será procesado
    return NextResponse.json({ 
      message: 'Evento programado para procesamiento (se procesará el más reciente)',
      pageId,
      debounceTimeMs: DEBOUNCE_TIME
    });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

async function processNotionPage(pageId: string, workspaceName?: string, action: 'create' | 'update' = 'create'): Promise<ProcessingResult> {
  try {
    console.log(`${action === 'update' ? 'Actualizando' : 'Creando'} tarea para página:`, pageId);
    
    // Si es una actualización, primero buscar la tarea existente
    if (action === 'update') {
      const existingTask = await findTaskByNotionUrl(pageId, TODOIST_PROJECT_ID);
      if (existingTask) {
        console.log(`📝 Tarea existente encontrada: ${existingTask.id}`);
        return await updateExistingTask(existingTask, pageId, workspaceName);
      } else {
        console.log(`⚠️ No se encontró tarea existente para página ${pageId}, creando nueva tarea`);
        // Si no encuentra la tarea existente, crear una nueva
        action = 'create';
      }
    }

    // Crear nueva tarea (flujo original)
    console.log('Obteniendo contenido de Notion para página:', pageId);
    const pageContent = await getNotionPageContent(pageId);

    let finalContent = pageContent;
    let enhancedWithAI = false;

    if (ENABLE_AI_ENHANCEMENT && process.env.OPENAI_API_KEY) {
      try {
        console.log('Enriqueciendo tarea con IA...');
        const aiEnhancement = await enhanceTaskWithAI(pageContent);
        
        finalContent = {
          ...pageContent,
          title: aiEnhancement.enhancedTitle,
          content: aiEnhancement.enhancedDescription,
          priority: aiEnhancement.suggestedPriority,
          tags: aiEnhancement.suggestedLabels,
          dueDate: aiEnhancement.suggestedDueDate || pageContent.dueDate,
        };
        
        enhancedWithAI = true;
        console.log('Tarea enriquecida con IA exitosamente');
      } catch (aiError) {
        console.error('Error al enriquecer con IA, continuando sin mejoras:', aiError);
      }
    }

    console.log('Creando tarea en Todoist...');
    
    const baseTags = finalContent.tags || ['notion'];
    const workspaceTag = workspaceName ? createWorkspaceTag(workspaceName) : '';
    const allTags = workspaceTag 
      ? combineTagsWithWorkspace(baseTags, workspaceTag)
      : baseTags;
    
    console.log(`🏷️ Etiquetas para la tarea: ${allTags.join(', ')}${workspaceName ? ` (workspace: ${workspaceName})` : ''}`);
    
    const todoistTask = {
      content: finalContent.title,
      description: `${finalContent.content}\n\n🔗 Ver en Notion: ${finalContent.url}${workspaceName ? `\n📁 Workspace: ${workspaceName}` : ''}`,
      project_id: TODOIST_PROJECT_ID,
      priority: finalContent.priority || 2,
      labels: allTags,
      ...(finalContent.dueDate && {
        due_date: formatDateForTodoist(finalContent.dueDate),
      }),
    };

    const todoistResponse = await createTodoistTask(todoistTask);
    
    console.log('Tarea creada exitosamente en Todoist:', todoistResponse.id);

    return {
      success: true,
      todoistTaskId: todoistResponse.id,
      notionPageId: pageId,
      enhancedWithAI,
    };
  } catch (error) {
    console.error('Error procesando página de Notion:', error);
    return {
      success: false,
      notionPageId: pageId,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

async function updateExistingTask(existingTask: any, pageId: string, workspaceName?: string): Promise<ProcessingResult> {
  try {
    console.log('Obteniendo contenido actualizado de Notion para página:', pageId);
    const pageContent = await getNotionPageContent(pageId);
    
    // Verificar el estado de la página
    console.log('Verificando estado de la página...');
    const pageStatus = await getNotionPageStatus(pageId);
    console.log('Estado de la página:', pageStatus);
    
    // Si el estado es "Listo" o "Done", completar la tarea en Todoist
    const completedStatuses = ['Listo', 'Done', 'Completed', 'Completado', 'Terminado', 'Finished'];
    if (pageStatus && completedStatuses.includes(pageStatus)) {
      console.log(`📋 Página marcada como "${pageStatus}" - completando tarea en Todoist`);
      
      try {
        await completeTodoistTask(existingTask.id);
        console.log('✅ Tarea completada exitosamente en Todoist');
        
        return {
          success: true,
          action: 'completed',
          taskId: existingTask.id,
          title: pageContent.title,
          message: `Tarea marcada como completada en Todoist (estado: ${pageStatus})`
        };
      } catch (error) {
        console.error('Error al completar tarea en Todoist:', error);
        // Continuar con actualización normal si no se puede completar
      }
    }

    let finalContent = pageContent;
    let enhancedWithAI = false;

    if (ENABLE_AI_ENHANCEMENT && process.env.OPENAI_API_KEY) {
      try {
        console.log('Enriqueciendo actualización de tarea con IA...');
        const aiEnhancement = await enhanceTaskWithAI(pageContent);
        
        finalContent = {
          ...pageContent,
          title: aiEnhancement.enhancedTitle,
          content: aiEnhancement.enhancedDescription,
          priority: aiEnhancement.suggestedPriority,
          tags: aiEnhancement.suggestedLabels,
          dueDate: aiEnhancement.suggestedDueDate || pageContent.dueDate,
        };
        
        enhancedWithAI = true;
        console.log('Actualización de tarea enriquecida con IA exitosamente');
      } catch (aiError) {
        console.error('Error al enriquecer actualización con IA, continuando sin mejoras:', aiError);
      }
    }

    console.log('Actualizando tarea en Todoist...');
    
    const baseTags = finalContent.tags || ['notion'];
    const workspaceTag = workspaceName ? createWorkspaceTag(workspaceName) : '';
    const allTags = workspaceTag 
      ? combineTagsWithWorkspace(baseTags, workspaceTag)
      : baseTags;
    
    console.log(`🏷️ Etiquetas actualizadas para la tarea: ${allTags.join(', ')}${workspaceName ? ` (workspace: ${workspaceName})` : ''}`);
    
    const updates = {
      content: finalContent.title,
      description: `${finalContent.content}\n\n🔗 Ver en Notion: ${finalContent.url}${workspaceName ? `\n📁 Workspace: ${workspaceName}` : ''}`,
      priority: finalContent.priority || 2,
      labels: allTags,
      ...(finalContent.dueDate && {
        due_date: formatDateForTodoist(finalContent.dueDate),
      }),
    };

    await updateTodoistTask(existingTask.id, updates);
    
    console.log('Tarea actualizada exitosamente en Todoist:', existingTask.id);

    return {
      success: true,
      todoistTaskId: existingTask.id,
      notionPageId: pageId,
      enhancedWithAI,
    };
  } catch (error) {
    console.error('Error actualizando tarea existente:', error);
    return {
      success: false,
      notionPageId: pageId,
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar',
    };
  }
}

// Endpoint GET para verificar que la API está funcionando
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Notion-Todoist Webhook API funcionando',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: 'POST /api/notion-webhook',
      health: 'GET /api/notion-webhook',
    },
    features: {
      duplicatePrevention: 'Latest-event debounce system (60s window)',
      taskUpdates: 'Updates existing Todoist tasks for page property changes',
      aiEnhancement: 'OpenAI task improvement',
      workspaceTags: 'Automatic workspace labeling',
      mentionDetection: 'User-specific filtering',
    },
    configuration: {
      notionUserIdConfigured: !!NOTION_USER_ID,
      todoistProjectIdConfigured: !!TODOIST_PROJECT_ID,
      aiEnhancementEnabled: ENABLE_AI_ENHANCEMENT,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      debounceTimeSeconds: DEBOUNCE_TIME / 1000,
      currentlyTrackedPages: recentlyProcessed.size,
      pendingEvents: pendingEvents.size,
    },
  });
}
