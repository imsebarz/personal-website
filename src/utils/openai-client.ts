import OpenAI from 'openai';
import { NotionPageContent, OpenAIEnhancement } from '@/types/notion-todoist';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function enhanceTaskWithAI(pageContent: NotionPageContent): Promise<OpenAIEnhancement> {
  const userPrompt = `
Analiza el siguiente contenido de una página de Notion y mejora la información para crear una tarea en Todoist:

Título: ${pageContent.title}
Contenido: ${pageContent.content}
URL: ${pageContent.url}
Prioridad actual: ${pageContent.priority}
Fecha de vencimiento: ${pageContent.dueDate || 'No especificada'}
Asignado: ${pageContent.assignee || 'No especificado'}
Etiquetas: ${pageContent.tags?.join(', ') || 'Ninguna'}

Por favor, proporciona:
1. Un título mejorado y más claro para la tarea
2. Una descripción enriquecida que incluya el contexto y los pasos de acción
3. Una prioridad sugerida (1-4, donde 4 es la más alta)
4. Etiquetas sugeridas relevantes (SOLO usa: nombre del proyecto, nombre de la tabla/base de datos, o etiquetas existentes en la respuesta original de Notion)
5. Una fecha de vencimiento sugerida si no hay una (formato YYYY-MM-DD)

IMPORTANTE: 
- No inventes subtareas ni dividas la tarea principal. Mantén la tarea como una sola unidad de trabajo basada únicamente en el contenido proporcionado.
- Para las etiquetas, ÚNICAMENTE usa información que ya existe en los datos de Notion proporcionados. No inventes etiquetas nuevas.

Responde en formato JSON con la siguiente estructura:
{
  "enhancedTitle": "título mejorado",
  "enhancedDescription": "descripción detallada con contexto y pasos de acción",
  "suggestedPriority": número_entre_1_y_4,
  "suggestedLabels": ["etiqueta1", "etiqueta2"],
  "suggestedDueDate": "YYYY-MM-DD o null si no es necesaria"
}
`;

  try {
    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      instructions: 'Eres un asistente experto en productividad que ayuda a optimizar tareas y proyectos. Responde únicamente con JSON válido.',
      input: userPrompt,
      text: {
        format: { type: 'json_object' }
      },
      max_output_tokens: 500,
    });

    const content = response.output_text;
    if (!content) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    return parseOpenAIResponse(content, pageContent);
  } catch (error: unknown) {
    console.error('Error al enriquecer con IA:', error);
    
    // Mostrar mensaje específico según el tipo de error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorObj = error as any;
    if (errorObj?.status === 429) {
      console.log('⚠️  Cuota de OpenAI excedida - usando contenido original');
    } else if (errorObj?.status === 401) {
      console.log('⚠️  Token de OpenAI inválido - usando contenido original');
    } else {
      console.log('⚠️  Error de OpenAI - usando contenido original');
    }
    
    // Fallback si falla OpenAI
    return {
      enhancedTitle: pageContent.title,
      enhancedDescription: `${pageContent.content}\n\n🔗 Ver en Notion: ${pageContent.url}`,
      suggestedPriority: pageContent.priority || 2,
      suggestedLabels: pageContent.tags && pageContent.tags.length > 0 ? pageContent.tags : ['notion'],
      suggestedDueDate: pageContent.dueDate,
    };
  }
}

function parseOpenAIResponse(content: string, pageContent: NotionPageContent): OpenAIEnhancement {
  try {
    const parsed = JSON.parse(content);
    return {
      enhancedTitle: parsed.enhancedTitle || pageContent.title,
      enhancedDescription: parsed.enhancedDescription || pageContent.content,
      suggestedPriority: Math.min(Math.max(parsed.suggestedPriority || pageContent.priority || 1, 1), 4),
      suggestedLabels: Array.isArray(parsed.suggestedLabels) ? parsed.suggestedLabels : pageContent.tags || [],
      suggestedDueDate: parsed.suggestedDueDate === 'null' ? undefined : parsed.suggestedDueDate,
    };
  } catch (parseError) {
    console.error('Error al parsear respuesta de OpenAI:', parseError);
    // Fallback con los datos originales
    return {
      enhancedTitle: pageContent.title,
      enhancedDescription: `${pageContent.content}\n\n🔗 Ver en Notion: ${pageContent.url}`,
      suggestedPriority: pageContent.priority || 2,
      suggestedLabels: pageContent.tags && pageContent.tags.length > 0 ? pageContent.tags : ['notion'],
      suggestedDueDate: pageContent.dueDate,
    };
  }
}
