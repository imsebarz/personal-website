// Test rápido para verificar extracción de ID de Notion
const description = `Esta tarea consiste en contactar a Pascual para obtener las medidas necesarias relacionadas con el proyecto actual. Se debe recopilar toda la información precisa y asegurarse de que las medidas sean correctas para evitar errores en etapas posteriores. Revisar la información disponible en el enlace proporcionado para mayor contexto y registrar las medidas recibidas para uso futuro.

🔗 Ver en Notion:  https://www.notion.so/Pedir-medidas-de-pascual-2321ad4d650d800bac4df93e5c760f38 
📁 Workspace: Corabella Pets`;

// Simulamos la función extractNotionPageId
function extractNotionPageId(description) {
  try {
    const patterns = [
      // Patrones directos con ID
      /notion\.so\/([a-f0-9]{32})/i,
      /notion\.so\/([a-f0-9-]{36})/i,
      /www\.notion\.so\/([a-f0-9]{32})/i,
      /www\.notion\.so\/([a-f0-9-]{36})/i,
      /notion\.com\/([a-f0-9]{32})/i,
      /notion\.com\/([a-f0-9-]{36})/i,
      
      // Patrones con título de página seguido de ID
      /notion\.so\/[^\/\s]*-([a-f0-9]{32})/i,
      /notion\.so\/[^\/\s]*-([a-f0-9-]{36})/i,
      /www\.notion\.so\/[^\/\s]*-([a-f0-9]{32})/i,
      /www\.notion\.so\/[^\/\s]*-([a-f0-9-]{36})/i,
      /notion\.com\/[^\/\s]*-([a-f0-9]{32})/i,
      /notion\.com\/[^\/\s]*-([a-f0-9-]{36})/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        let pageId = match[1];
        
        // Si el ID no tiene guiones, agregarlos en el formato correcto
        if (pageId.length === 32 && !pageId.includes('-')) {
          pageId = [
            pageId.slice(0, 8),
            pageId.slice(8, 12),
            pageId.slice(12, 16),
            pageId.slice(16, 20),
            pageId.slice(20)
          ].join('-');
        }
        
        return pageId;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

const extractedId = extractNotionPageId(description);
console.log('Descripción:', description);
console.log('\nID extraído:', extractedId);
console.log('ID formateado:', extractedId ? extractedId : 'NO ENCONTRADO');
