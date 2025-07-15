import { NextRequest, NextResponse } from 'next/server';
import { NotionWebhookPayload, ProcessingResult } from '@/types/notion-todoist';
import { getNotionPageContent, isUserMentioned } from '@/utils/notion-client';
import { createTodoistTask, formatDateForTodoist } from '@/utils/todoist-client';
import { enhanceTaskWithAI } from '@/utils/openai-client';

// Configuración
const NOTION_USER_ID = process.env.NOTION_USER_ID; // Tu ID de usuario en Notion
const TODOIST_PROJECT_ID = process.env.TODOIST_PROJECT_ID; // ID del proyecto por defecto en Todoist
const ENABLE_AI_ENHANCEMENT = process.env.ENABLE_AI_ENHANCEMENT === 'true';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parsear el payload del webhook primero
    const payload: NotionWebhookPayload = await request.json();

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

    // Verificar que el webhook provenga de Notion (solo para eventos reales)
    const notionVersion = request.headers.get('notion-version');
    if (!notionVersion) {
      console.log('⚠️ Webhook sin header notion-version - rechazando evento real');
      return NextResponse.json(
        { error: 'Webhook no válido - falta encabezado Notion' },
        { status: 400 }
      );
    }

    // TODO: Implementar validación de firma (recomendado para producción)
    // const rawBody = await request.text();
    // if (!validateNotionWebhook(request, rawBody)) {
    //   return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    // }
    
    // Log para debugging de eventos reales
    console.log('📥 Webhook recibido:', JSON.stringify(payload, null, 2));

    // Verificar que es un evento de página (nuevo formato usa entity)
    const pageId = payload.entity?.id || payload.page?.id;
    if (!pageId || (payload.entity?.object !== 'page' && !payload.page)) {
      return NextResponse.json(
        { message: 'Evento ignorado - no es una página' },
        { status: 200 }
      );
    }

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

    // Procesar la página
    const result = await processNotionPage(pageId);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

async function processNotionPage(pageId: string): Promise<ProcessingResult> {
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
    const todoistTask = {
      content: finalContent.title,
      description: `${finalContent.content}\n\n🔗 Ver en Notion: ${finalContent.url}`,
      project_id: TODOIST_PROJECT_ID,
      priority: finalContent.priority || 2,
      labels: finalContent.tags || ['notion'],
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
    configuration: {
      notionUserIdConfigured: !!NOTION_USER_ID,
      todoistProjectIdConfigured: !!TODOIST_PROJECT_ID,
      aiEnhancementEnabled: ENABLE_AI_ENHANCEMENT,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
    },
  });
}
