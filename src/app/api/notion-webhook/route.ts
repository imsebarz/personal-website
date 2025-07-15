import { NextRequest, NextResponse } from 'next/server';
import { NotionWebhookPayload, ProcessingResult } from '@/types/notion-todoist';
import { getNotionPageContent, isUserMentioned } from '@/utils/notion-client';
import { createTodoistTask, formatDateForTodoist } from '@/utils/todoist-client';
import { enhanceTaskWithAI } from '@/utils/openai-client';
import { 
  isValidNotionWebhook, 
  shouldProcessEvent 
} from '@/utils/notion-webhook-validator';
import { createWorkspaceTag, combineTagsWithWorkspace } from '@/utils/tag-helpers';
import { 
  logWebhookStart, 
  logWebhookSuccess, 
  logWebhookSkipped, 
  logWebhookError 
} from '@/utils/webhook-logger';

// Configuración
const NOTION_USER_ID = process.env.NOTION_USER_ID; // Tu ID de usuario en Notion
const TODOIST_PROJECT_ID = process.env.TODOIST_PROJECT_ID; // ID del proyecto por defecto en Todoist
const ENABLE_AI_ENHANCEMENT = process.env.ENABLE_AI_ENHANCEMENT === 'true';

// Cache para prevenir duplicados
const recentlyProcessed = new Map<string, number>();
const DEBOUNCE_TIME = 60000; // 60 segundos

export async function POST(request: NextRequest): Promise<NextResponse> {
  const processingStartTime = Date.now();
  let requestId: string | undefined;
  let payload: NotionWebhookPayload | undefined;
  let pageId: string | undefined;
  
  try {
    // Parsear el payload del webhook primero
    payload = await request.json();
    
    if (!payload) {
      throw new Error('Payload vacío o inválido');
    }
    
    // 📊 INICIAR LOGGING
    requestId = await logWebhookStart(request, payload);
    console.log(`🚀 Procesando request ${requestId}`);

    // 🔐 MANEJO DE VERIFICACIÓN DE NOTION
    // Según la documentación oficial, Notion envía verification_token para verificar el endpoint
    if ('verification_token' in payload) {
      console.log('🔍 Verificación de Notion recibida:', payload.verification_token);
      
      // Guardar el token para validación posterior (opcional pero recomendado)
      console.log('� Token de verificación para validación de firmas:', payload.verification_token);
      
      // Responder con el mismo payload para completar la verificación
      return NextResponse.json({
        verification_token: payload.verification_token
      }, { status: 200 });
    }

    // Log headers para debugging
    console.log('📋 Headers recibidos:', {
      'notion-version': request.headers.get('notion-version'),
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type'),
      'x-notion-signature': request.headers.get('x-notion-signature'),
    });

    // Verificar que el webhook provenga de Notion
    const userAgent = request.headers.get('user-agent');
    const hasNotionSignature = !!request.headers.get('x-notion-signature');
    
    if (!isValidNotionWebhook(userAgent, hasNotionSignature)) {
      console.log('⚠️ Webhook no válido - no proviene de Notion');
      return NextResponse.json(
        { error: 'Webhook no válido - no proviene de Notion' },
        { status: 400 }
      );
    }

    // TODO: Habilitar validación de firma en producción
    // const webhookSecret = process.env.NOTION_WEBHOOK_SECRET;
    // if (webhookSecret) {
    //   const rawBody = JSON.stringify(payload);
    //   const signature = request.headers.get('x-notion-signature');
    //   if (!validateNotionWebhookSignature(signature, rawBody, webhookSecret)) {
    //     console.log('🔒 Firma de webhook inválida');
    //     return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    //   }
    // }

    // TODO: Implementar validación de firma (recomendado para producción)
    // const rawBody = await request.text();
    // if (!validateNotionWebhook(request, rawBody)) {
    //   return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    // }
    
    // Log para debugging de eventos reales
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

    // Verificar si ya procesamos esta página recientemente (prevenir duplicados)
    const now = Date.now();
    const lastProcessed = recentlyProcessed.get(pageId);
    
    if (lastProcessed && (now - lastProcessed) < DEBOUNCE_TIME) {
      console.log(`⏳ Página ${pageId} procesada recientemente hace ${Math.round((now - lastProcessed) / 1000)}s, ignorando evento ${payload.type}`);
      
      const duration = Date.now() - processingStartTime;
      logWebhookSkipped(requestId, duration, 'procesado recientemente', pageId, payload.type);
      
      return NextResponse.json({ message: 'Evento ignorado - procesado recientemente' });
    }

    // Marcar como procesado INMEDIATAMENTE para prevenir duplicados
    recentlyProcessed.set(pageId, now);

    // Limpiar cache viejo (mantener solo últimos 10 minutos)
    const entriesToDelete: string[] = [];
    recentlyProcessed.forEach((timestamp, id) => {
      if (now - timestamp > 600000) { // 10 minutos
        entriesToDelete.push(id);
      }
    });
    entriesToDelete.forEach(id => recentlyProcessed.delete(id));

    // Verificar si el usuario está mencionado (si se configuró)
    if (NOTION_USER_ID) {
      const isMentioned = await isUserMentioned(pageId, NOTION_USER_ID);
      if (!isMentioned) {
        console.log('Usuario no mencionado en la página');
        
        const duration = Date.now() - processingStartTime;
        logWebhookSkipped(requestId, duration, 'usuario no mencionado', pageId, payload.type);
        
        return NextResponse.json(
          { message: 'Usuario no mencionado - tarea no creada' },
          { status: 200 }
        );
      }
    }

    // Procesar la página
    const result = await processNotionPage(pageId, payload.workspace_name);

    // Logging del resultado (el cache ya se actualizó arriba)
    if (result.success) {
      console.log(`✅ Página ${pageId} procesada exitosamente`);
      
      const duration = Date.now() - processingStartTime;
      logWebhookSuccess(requestId, duration, pageId, payload.type);
    } else {
      const duration = Date.now() - processingStartTime;
      logWebhookError(requestId, duration, result.error || 'Error desconocido', pageId, payload.type);
    }

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    
    const duration = Date.now() - processingStartTime;
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    // Solo hacer logging si tenemos requestId
    if (requestId!) {
      const errorPageId = payload?.entity?.id || payload?.page?.id;
      logWebhookError(requestId, duration, errorMessage, errorPageId, payload?.type);
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

async function processNotionPage(pageId: string, workspaceName?: string): Promise<ProcessingResult> {
  try {
    // 1. Obtener contenido de Notion
    console.log('Obteniendo contenido de Notion para página:', pageId);
    const pageContent = await getNotionPageContent(pageId);

    // 2. Enriquecer con IA si está habilitado
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

    // 3. Crear tarea en Todoist
    console.log('Creando tarea en Todoist...');
    
    // Preparar etiquetas incluyendo el workspace
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
      duplicatePrevention: 'Debounce system (30s window)',
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
    },
  });
}
