# Etiquetas de Workspace Automáticas

## ✨ Nueva Funcionalidad: Etiquetas de Workspace

Tu automatización Notion-Todoist ahora incluye automáticamente el nombre del workspace de Notion como una etiqueta en las tareas de Todoist.

### 🏷️ Cómo Funciona

Cuando se crea una tarea desde una página de Notion, el sistema:

1. **Extrae el workspace name** del webhook de Notion
2. **Sanitiza el nombre** para crear una etiqueta válida de Todoist
3. **Combina las etiquetas** existentes con la etiqueta del workspace

### 📝 Ejemplos de Conversión

| Workspace en Notion | Etiqueta en Todoist |
|---------------------|---------------------|
| `Corabella Pets` | `corabella-pets` |
| `My Personal Workspace!` | `my-personal-workspace` |
| `Work & Development` | `work-development` |
| `Client - ABC Corp` | `client-abc-corp` |

### 🎯 Reglas de Sanitización

- **Minúsculas**: Todo se convierte a lowercase
- **Espacios → Guiones**: Los espacios se reemplazan con `-`
- **Caracteres especiales**: Se eliminan caracteres inválidos (`&`, `!`, etc.)
- **Límite de longitud**: Máximo 50 caracteres
- **Sin duplicados**: No se añade si ya existe la etiqueta

### 📊 Estructura de Etiquetas Final

```javascript
// Etiquetas base (de IA o por defecto)
baseTags = ['notion', 'urgent', 'marketing']

// Etiqueta del workspace
workspaceTag = 'corabella-pets'

// Resultado final
allTags = ['notion', 'urgent', 'marketing', 'corabella-pets']
```

### 📱 En la Descripción de Todoist

Las tareas también incluyen el workspace en la descripción:

```
Revisar diseño de la nueva campaña

🔗 Ver en Notion: https://notion.so/page-id
📁 Workspace: Corabella Pets
```

### 🔧 Beneficios

- **Organización mejorada**: Fácil filtrado por workspace
- **Contexto claro**: Sabes de qué workspace viene cada tarea
- **Búsqueda eficiente**: Busca tareas por nombre de workspace
- **Automatización completa**: Sin configuración manual necesaria

¡Ahora tus tareas de Todoist tendrán contexto completo del workspace de origen!
