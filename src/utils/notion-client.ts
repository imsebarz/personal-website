import { Client } from '@notionhq/client';
import { NotionPageContent } from '@/types/notion-todoist';

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
  } catch (error) {
    console.error('Error al obtener contenido de Notion:', error);
    throw new Error('No se pudo obtener el contenido de la página de Notion');
  }
}

export async function isUserMentioned(pageId: string, userId: string): Promise<boolean> {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });

    // Buscar menciones en el contenido
    const hasMention = blocks.results.some((block) => {
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

    return hasMention;
  } catch (error) {
    console.error('Error al verificar menciones:', error);
    return false;
  }
}
