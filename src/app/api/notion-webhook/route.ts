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

const NOTION_USER_ID = process.env.NOTION_USER_ID;
const TODOIST_PROJECT_ID = process.env.TODOIST_PROJECT_ID; 
const ENABLE_AI_ENHANCEMENT = process.env.ENABLE_AI_ENHANCEMENT === 'true';

const recentlyProcessed = new Map<string, number>();
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

    // Verificar si ya procesamos esta página recientemente (prevenir duplicados)
    const now = Date.now();
    const lastProcessed = recentlyProcessed.get(pageId);
    
    if (lastProcessed && (now - lastProcessed) < DEBOUNCE_TIME) {
      console.log(`⏳ Página ${pageId} procesada recientemente hace ${Math.round((now - lastProcessed) / 1000)}s, ignorando evento ${payload.type}`);
            
      return NextResponse.json({ message: 'Evento ignorado - procesado recientemente' });
    }
    recentlyProcessed.set(pageId, now);

    const entriesToDelete: string[] = [];
    recentlyProcessed.forEach((timestamp, id) => {
      if (now - timestamp > 60000) { 
        entriesToDelete.push(id);
      }
    });
    entriesToDelete.forEach(id => recentlyProcessed.delete(id));

    // Verificar si el usuario está mencionado (si se configuró)
    if (NOTION_USER_ID) {
      const isMentioned = await isUserMentioned(pageId, NOTION_USER_ID);
      if (!isMentioned) {
        console.log('Usuario no mencionado en la página');
            
        return NextResponse.json(
          { message: 'Usuario no mencionado - tarea no creada' },
          { status: 200 }
        );
      }
    }

    const result = await processNotionPage(pageId, payload.workspace_name);

    if (result.success) {
      console.log(`✅ Página ${pageId} procesada exitosamente`);
    } 
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
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

async function processNotionPage(pageId: string, workspaceName?: string): Promise<ProcessingResult> {
  try {
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
