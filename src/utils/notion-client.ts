import { Client } from '@notionhq/client';
import { NotionPageContent } from '@/types/notion-todoist';
import { logger } from '@/lib/logger';

// Interfaces para tipos de Notion
interface NotionRichText {
  type: string;
  mention?: {
    type: string;
    user: {
      id: string;
    };
  };
}

interface _NotionPeopleProperty {
  type: 'people';
  people: Array<{ id: string; type: string }>;
}

interface _NotionRichTextProperty {
  type: 'rich_text';
  rich_text: NotionRichText[];
}

interface _NotionTitleProperty {
  type: 'title';
  title: NotionRichText[];
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function getNotionPageContent(pageId: string): Promise<NotionPageContent> {
  try {
    // Obtener información de la página
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    // Obtener el contenido de la página
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });

    // Extraer título y contenido
    let title = 'Nueva tarea desde Notion';
    let content = '';
    let priority = 1;
    let dueDate: string | undefined;
    let assignee: string | undefined;
    let tags: string[] = [];

    // Extraer propiedades de la página

    // Procesar propiedades de la página
    if ('properties' in page && page.properties) {
      // Extraer título (puede estar en diferentes propiedades dependiendo de la configuración)
      const titleProperty = Object.values(page.properties).find(
        (prop) => prop.type === 'title'
      );
      
      if (titleProperty && titleProperty.type === 'title' && titleProperty.title[0]) {
        title = titleProperty.title[0].plain_text;
      }

      // Extraer otras propiedades relevantes
      Object.entries(page.properties).forEach(([key, property]) => {
        if (property.type === 'select' && property.select?.name) {
          if (key.toLowerCase().includes('priority') || key.toLowerCase().includes('prioridad')) {
            const priorityValue = property.select.name.toLowerCase();
            if (priorityValue.includes('high') || priorityValue.includes('alta')) priority = 4;
            else if (priorityValue.includes('medium') || priorityValue.includes('media')) priority = 3;
            else if (priorityValue.includes('low') || priorityValue.includes('baja')) priority = 2;
          }
        }

        if (property.type === 'date' && property.date?.start) {
          dueDate = property.date.start;
        }

        if (property.type === 'people' && property.people.length > 0) {
          const user = property.people[0];
          if ('name' in user && user.name) {
            assignee = user.name;
          } else {
            assignee = user.id;
          }
        }

        if (property.type === 'multi_select' && property.multi_select.length > 0) {
          tags = property.multi_select.map(tag => tag.name);
        }
      });
    }

    // Procesar contenido de bloques
    if (blocks.results.length > 0) {
      content = blocks.results
        .map((block) => {
          if ('type' in block) {
            switch (block.type) {
              case 'paragraph':
                return block.paragraph.rich_text
                  .map((text) => text.plain_text)
                  .join('');
              case 'heading_1':
                return `# ${block.heading_1.rich_text
                  .map((text) => text.plain_text)
                  .join('')}`;
              case 'heading_2':
                return `## ${block.heading_2.rich_text
                  .map((text) => text.plain_text)
                  .join('')}`;
              case 'heading_3':
                return `### ${block.heading_3.rich_text
                  .map((text) => text.plain_text)
                  .join('')}`;
              case 'bulleted_list_item':
                return `• ${block.bulleted_list_item.rich_text
                  .map((text) => text.plain_text)
                  .join('')}`;
              case 'numbered_list_item':
                return `1. ${block.numbered_list_item.rich_text
                  .map((text) => text.plain_text)
                  .join('')}`;
              case 'to_do':
                const checked = block.to_do.checked ? '✅' : '☐';
                return `${checked} ${block.to_do.rich_text
                  .map((text) => text.plain_text)
                  .join('')}`;
              default:
                return '';
            }
          }
          return '';
        })
        .filter(text => text.length > 0)
        .join('\n');
    }

    return {
      title,
      content: content || 'Contenido extraído desde Notion',
      url: 'url' in page ? page.url : `https://notion.so/${pageId}`,
      priority,
      dueDate,
      assignee,
      tags,
    };
  } catch (_error) {
    throw new Error('No se pudo obtener el contenido de la página de Notion');
  }
}

export async function isUserMentioned(pageId: string, userId: string): Promise<boolean> {
  try {
    // 1. Verificar menciones en las propiedades de la página
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    if ('properties' in page && page.properties) {
      // Buscar menciones en las propiedades de la página
      const hasMentionInProperties = Object.values(page.properties).some((property) => {
        // Verificar propiedades de tipo "people"
        if (property.type === 'people' && property.people.length > 0) {
          return property.people.some(person => person.id === userId);
        }
        
        // Verificar propiedades de texto rico que pueden contener menciones
        if (property.type === 'rich_text' && property.rich_text.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return property.rich_text.some((text: any) => {
            if (text.type === 'mention' && text.mention?.type === 'user' && text.mention?.user?.id) {
              return text.mention.user.id === userId;
            }
            return false;
          });
        }
        
        // Verificar propiedades de título que pueden contener menciones
        if (property.type === 'title' && property.title.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return property.title.some((text: any) => {
            if (text.type === 'mention' && text.mention?.type === 'user' && text.mention?.user?.id) {
              return text.mention.user.id === userId;
            }
            return false;
          });
        }
        
        return false;
      });
      
      if (hasMentionInProperties) {
        return true;
      }
    }

    // 2. Verificar menciones en el contenido de bloques (método original)
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });

    const hasMentionInContent = blocks.results.some((block) => {
      if ('type' in block) {
        const checkRichText = (richTextArray: unknown[]) => {
          return richTextArray.some((text: unknown) => {
            if (typeof text === 'object' && text !== null && 'type' in text && 'mention' in text) {
              const textObj = text as { type: string; mention: { type: string; user: { id: string } } };
              if (textObj.type === 'mention' && textObj.mention.type === 'user') {
                return textObj.mention.user.id === userId;
              }
            }
            return false;
          });
        };

        switch (block.type) {
          case 'paragraph':
            return checkRichText(block.paragraph.rich_text);
          case 'heading_1':
            return checkRichText(block.heading_1.rich_text);
          case 'heading_2':
            return checkRichText(block.heading_2.rich_text);
          case 'heading_3':
            return checkRichText(block.heading_3.rich_text);
          case 'bulleted_list_item':
            return checkRichText(block.bulleted_list_item.rich_text);
          case 'numbered_list_item':
            return checkRichText(block.numbered_list_item.rich_text);
          case 'to_do':
            return checkRichText(block.to_do.rich_text);
          default:
            return false;
        }
      }
      return false;
    });

    if (hasMentionInContent) {
      return true;
    }

    return false;
  } catch (_error) {
    return false;
  }
}

export async function getNotionPageStatus(pageId: string): Promise<string | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    if ('properties' in page) {
      // Buscar propiedades de estado comunes
      const statusProperties = ['Status', 'Estado', 'state', 'status'];
      
      for (const propName of statusProperties) {
        const property = page.properties[propName];
        if (property && property.type === 'status') {
          return property.status?.name || null;
        }
        if (property && property.type === 'select') {
          return property.select?.name || null;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo estado de página de Notion:', error);
    return null;
  }
}

export async function updateNotionPageStatus(pageId: string, status: string): Promise<void> {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    if ('properties' in page) {
      // Buscar propiedades de estado comunes
      const statusProperties = ['Status', 'Estado', 'state', 'status'];
      let statusPropertyName: string | null = null;
      let statusPropertyType: string | null = null;
      
      for (const propName of statusProperties) {
        const property = page.properties[propName];
        if (property && (property.type === 'status' || property.type === 'select')) {
          statusPropertyName = propName;
          statusPropertyType = property.type;
          break;
        }
      }
      
      if (statusPropertyName && statusPropertyType && 'parent' in page && page.parent.type === 'database_id') {
        // Obtener el schema del database para conocer las opciones disponibles
        const database = await notion.databases.retrieve({ database_id: page.parent.database_id });
        const statusProperty = database.properties[statusPropertyName];
        
        let availableOptions: string[] = [];
        
        if (statusProperty && statusProperty.type === 'status' && 'status' in statusProperty) {
          availableOptions = statusProperty.status.options.map(option => option.name);
        } else if (statusProperty && statusProperty.type === 'select' && 'select' in statusProperty) {
          availableOptions = statusProperty.select.options.map(option => option.name);
        }
        
        logger.info('Available status options from database', {
          pageId,
          statusProperty: statusPropertyName,
          availableOptions,
          requestedStatus: status
        });
        
        // Intentar primero con el estado solicitado
        let targetStatus = status;
        
        // Si el estado solicitado no está disponible, buscar el más apropiado
        if (!availableOptions.includes(status)) {
          const bestMatch = findBestStatusMatch(status, availableOptions);
          
          if (!bestMatch) {
            throw new Error(`No suitable status found. Requested: "${status}". Available options: ${availableOptions.join(', ')}`);
          }
          
          targetStatus = bestMatch;
          
          logger.info(`Status "${status}" not available, using "${targetStatus}" instead`, {
            pageId,
            requestedStatus: status,
            selectedStatus: targetStatus,
            availableOptions
          });
        }
        
        const updatePayload = {
          page_id: pageId,
          properties: {} as Record<string, unknown>
        };
        
        if (statusPropertyType === 'status') {
          updatePayload.properties[statusPropertyName] = {
            status: {
              name: targetStatus
            }
          };
        } else if (statusPropertyType === 'select') {
          updatePayload.properties[statusPropertyName] = {
            select: {
              name: targetStatus
            }
          };
        }
        
        // TypeScript assertion necesaria debido a los tipos complejos de Notion API
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await notion.pages.update(updatePayload as any);
        
        logger.info(`Successfully updated Notion page status`, {
          pageId,
          statusProperty: statusPropertyName,
          propertyType: statusPropertyType,
          newStatus: targetStatus
        });
      } else {
        throw new Error('No se encontró una propiedad de estado en la página de Notion o la página no pertenece a una base de datos');
      }
    }
  } catch (error) {
    console.error('Error actualizando estado de página de Notion:', error);
    throw new Error('No se pudo actualizar el estado de la página en Notion');
  }
}

/**
 * Encuentra el mejor estado coincidente de las opciones disponibles
 */
function findBestStatusMatch(requestedStatus: string, availableOptions: string[]): string | null {
  // Mapas de estados por categorías
  const statusMaps = {
    completed: [
      'Completado', 'Completed', 'Done', 'Finished', 'Complete', 
      'Listo', 'Terminado', 'Finalizado', 'Cerrado', 'Closed'
    ],
    inProgress: [
      'En progreso', 'In Progress', 'Todo', 'Doing', 'En curso', 
      'Pendiente', 'Not started', 'Sin empezar', 'Open', 'Abierto', 
      'Active', 'Working', 'Trabajando'
    ],
    pending: [
      'Pendiente', 'Pending', 'Todo', 'To do', 'Sin empezar', 
      'Not started', 'Backlog', 'Open', 'Abierto'
    ]
  };
  
  // Determinar la categoría del estado solicitado
  let targetCategory: string[] = [];
  
  for (const [category, statuses] of Object.entries(statusMaps)) {
    if (statuses.some(s => s.toLowerCase() === requestedStatus.toLowerCase())) {
      targetCategory = statuses;
      break;
    }
  }
  
  // Si no encontramos categoría, usar una búsqueda más amplia
  if (targetCategory.length === 0) {
    if (requestedStatus.toLowerCase().includes('complet') || 
        requestedStatus.toLowerCase().includes('done') || 
        requestedStatus.toLowerCase().includes('finish')) {
      targetCategory = statusMaps.completed;
    } else if (requestedStatus.toLowerCase().includes('progress') || 
               requestedStatus.toLowerCase().includes('doing') || 
               requestedStatus.toLowerCase().includes('curso')) {
      targetCategory = statusMaps.inProgress;
    } else {
      targetCategory = statusMaps.pending;
    }
  }
  
  // Buscar la mejor coincidencia en las opciones disponibles
  for (const possibleStatus of targetCategory) {
    const match = availableOptions.find(option => 
      option.toLowerCase() === possibleStatus.toLowerCase()
    );
    if (match) {
      return match;
    }
  }
  
  // Si no hay coincidencia exacta, buscar coincidencias parciales
  for (const possibleStatus of targetCategory) {
    const match = availableOptions.find(option => 
      option.toLowerCase().includes(possibleStatus.toLowerCase()) ||
      possibleStatus.toLowerCase().includes(option.toLowerCase())
    );
    if (match) {
      return match;
    }
  }
  
  // Como último recurso, devolver la primera opción disponible
  return availableOptions.length > 0 ? availableOptions[0] : null;
}

export async function findNotionPageByTodoistTaskId(_todoistTaskId: string): Promise<string | null> {
  try {
    // Buscar en la base de datos usando la URL de la tarea de Todoist
    // Nota: Esta función requiere que tengas acceso a una base de datos donde se almacenen las relaciones
    // O que busques en las descripciones de las páginas el ID de la tarea de Todoist
    
    // Por ahora, implementaremos una búsqueda básica
    // En una implementación más robusta, deberías mantener una base de datos de relaciones
    
    return null; // Placeholder - se implementará según la estructura específica de tu Notion
  } catch (error) {
    console.error('Error buscando página de Notion por ID de tarea de Todoist:', error);
    return null;
  }
}
