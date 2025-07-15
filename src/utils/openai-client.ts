import OpenAI from 'openai';
import { NotionPageContent, OpenAIEnhancement } from '@/types/notion-todoist';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function enhanceTaskWithAI(pageContent: NotionPageContent): Promise<OpenAIEnhancement> {
  try {
    const prompt = `
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
4. Etiquetas sugeridas relevantes
5. Una fecha de vencimiento sugerida si no hay una (formato YYYY-MM-DD)

Responde en formato JSON con la siguiente estructura:
{
  "enhancedTitle": "título mejorado",
  "enhancedDescription": "descripción detallada con contexto y pasos de acción",
  "suggestedPriority": número_entre_1_y_4,
  "suggestedLabels": ["etiqueta1", "etiqueta2"],
  "suggestedDueDate": "YYYY-MM-DD o null si no es necesaria"
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente experto en productividad que ayuda a optimizar tareas y proyectos. Responde únicamente con JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    // Intentar parsear la respuesta JSON
    let enhancement: OpenAIEnhancement;
    try {
      const parsed = JSON.parse(content);
      enhancement = {
        enhancedTitle: parsed.enhancedTitle || pageContent.title,
        enhancedDescription: parsed.enhancedDescription || pageContent.content,
        suggestedPriority: Math.min(Math.max(parsed.suggestedPriority || pageContent.priority || 1, 1), 4),
        suggestedLabels: Array.isArray(parsed.suggestedLabels) ? parsed.suggestedLabels : pageContent.tags || [],
        suggestedDueDate: parsed.suggestedDueDate === 'null' ? undefined : parsed.suggestedDueDate,
      };
    } catch (parseError) {
      console.error('Error al parsear respuesta de OpenAI:', parseError);
      // Fallback con los datos originales
      enhancement = {
        enhancedTitle: pageContent.title,
        enhancedDescription: `${pageContent.content}\n\n🔗 Ver en Notion: ${pageContent.url}`,
        suggestedPriority: pageContent.priority || 2,
        suggestedLabels: pageContent.tags || ['notion'],
        suggestedDueDate: pageContent.dueDate,
      };
    }

    return enhancement;
  } catch (error) {
    console.error('Error al enriquecer con IA:', error);
    // Fallback si falla OpenAI
    return {
      enhancedTitle: pageContent.title,
      enhancedDescription: `${pageContent.content}\n\n🔗 Ver en Notion: ${pageContent.url}`,
      suggestedPriority: pageContent.priority || 2,
      suggestedLabels: pageContent.tags || ['notion'],
      suggestedDueDate: pageContent.dueDate,
    };
  }
}
