# Notion-Todoist Integration

Automatización completa que conecta Notion con Todoist para crear tareas automáticamente cuando eres mencionado o asignado en páginas de Notion.

## 🚀 Características

- ✅ Webhook de Notion para eventos en tiempo real
- ✅ Creación automática de tareas en Todoist
- ✅ Enriquecimiento opcional con IA usando OpenAI
- ✅ Detección inteligente de menciones de usuario
- ✅ Extracción automática de metadatos (prioridad, fechas, etiquetas)
- ✅ Manejo robusto de errores y logging
- ✅ Scripts de prueba incluidos

## 📋 Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env.local` y completa las siguientes variables:

#### Obligatorias:
```bash
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TODOIST_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Opcionales:
```bash
NOTION_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
TODOIST_PROJECT_ID=2xxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ENABLE_AI_ENHANCEMENT=true
```

### 2. Obtener Tokens

#### Notion Token:
1. Ve a [Notion Integrations](https://www.notion.so/my-integrations)
2. Crea una nueva integración
3. Copia el token secreto
4. Comparte tu base de datos/páginas con la integración

#### Todoist Token:
1. Ve a [Todoist Settings > Integrations](https://todoist.com/prefs/integrations)
2. Copia tu API token

#### OpenAI Key (opcional):
1. Ve a [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Crea una nueva API key

### 3. Configurar Webhook en Notion

Sigue estos pasos basados en la documentación oficial de Notion:

1. **Crear suscripción**:
   - Ve a tu integración en [Notion Integrations](https://www.notion.so/my-integrations)
   - Navega a la pestaña "Webhooks"
   - Haz clic en "+ Create a subscription"

2. **Configurar endpoint**:
   - **Endpoint URL**: 
     - **Producción**: `https://tu-dominio.vercel.app/api/notion-webhook`
     - **Desarrollo**: Usa ngrok (ver sección de desarrollo local)
   - **Events**: Selecciona los eventos que quieres:
     - `page.content_updated` - Cuando se actualiza contenido de página
     - `page.created` - Cuando se crea una nueva página
     - `comment.created` - Cuando se crea un comentario

3. **Verificar suscripción**:
   - Notion enviará un `verification_token` a tu endpoint
   - Copia el token de los logs de tu servidor
   - Pégalo en el formulario de verificación de Notion
   - Haz clic en "Verify subscription"

4. **Configurar validación de firmas** (recomendado para producción):
   - Agrega el `verification_token` a `NOTION_VERIFICATION_TOKEN` en tus variables de entorno
   - Esto habilita la validación criptográfica de payloads

⚠️ **IMPORTANTE**: 
- NO uses `localhost` - Notion no puede acceder a tu máquina local
- La URL debe ser HTTPS y públicamente accesible
- Los eventos pueden tener un retraso de hasta 1 minuto (son agregados)

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus tokens

# Iniciar en desarrollo
npm run dev
```

## 🔧 Desarrollo Local con Webhooks Reales

Para probar webhooks reales desde Notion en desarrollo local:

### 1. Usar ngrok (Recomendado):
```bash
# Instalar ngrok globalmente
npm install -g ngrok

# En una terminal, iniciar tu servidor
npm run dev

# En otra terminal, exponer el puerto
ngrok http 3000

# Copiar la URL HTTPS que aparece (ej: https://abc123.ngrok.io)
# Configurar webhook en Notion: https://abc123.ngrok.io/api/notion-webhook
```

### 2. Alternativa con tunnelmole:
```bash
# Instalar tunnelmole
npm install -g tunnelmole

# Exponer puerto
tmole 3000

# Usar la URL que te proporciona
```

### 3. Solo para Pruebas Básicas:
Usa el script de prueba que simula webhooks:
```bash
npm run test:webhook

## 🧪 Pruebas

### Prueba Local (SIN webhook):
```bash
npm run test:webhook
```

### Prueba con Webhook Real (Desarrollo):
```bash
# 1. Instalar ngrok
npm install -g ngrok

# 2. Exponer tu servidor local
ngrok http 3000
# Copiar la URL https (ej: https://abc123.ngrok.io)

# 3. Configurar webhook en Notion con:
# https://abc123.ngrok.io/api/notion-webhook

# 4. Crear/editar una página en Notion y mencionar tu usuario
```

### Verificar Estado del Endpoint:
```bash
curl http://localhost:3000/api/notion-webhook
```

### Prueba Manual con cURL:
```bash
curl -X POST http://localhost:3000/api/notion-webhook \\
  -H "Content-Type: application/json" \\
  -H "notion-version: 2022-06-28" \\
  -d '{
    "object": "page",
    "event_type": "page.property_updated",
    "page": {
      "id": "test-page-id",
      "properties": {},
      "url": "https://notion.so/test"
    }
  }'
```

## 🚀 Despliegue en Vercel

### 1. Conectar Repositorio
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Importa tu repositorio de GitHub
3. Configura el proyecto como Next.js

### 2. Configurar Variables de Entorno en Vercel
Ve a Project Settings > Environment Variables y agrega:

```
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TODOIST_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
TODOIST_PROJECT_ID=2xxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ENABLE_AI_ENHANCEMENT=true
```

### 3. Actualizar Webhook URL
Actualiza la URL del webhook en Notion a:
```
https://tu-proyecto.vercel.app/api/notion-webhook
```

## 📁 Estructura del Proyecto

```
src/
├── app/api/notion-webhook/
│   └── route.ts              # Endpoint principal del webhook
├── types/
│   └── notion-todoist.ts     # Interfaces TypeScript
├── utils/
│   ├── notion-client.ts      # Cliente de Notion
│   ├── todoist-client.ts     # Cliente de Todoist
│   └── openai-client.ts      # Cliente de OpenAI
└── scripts/
    └── test-webhook.js       # Scripts de prueba
```

## 🔄 Flujo de Trabajo

1. **Evento en Notion**: Se actualiza/crea una página
2. **Webhook**: Notion envía evento al endpoint
3. **Verificación**: Se verifica si el usuario está mencionado
4. **Extracción**: Se extrae contenido y metadatos de la página
5. **Enriquecimiento**: (Opcional) Se mejora con IA
6. **Creación**: Se crea la tarea en Todoist
7. **Respuesta**: Se confirma el resultado

## 🤖 Enriquecimiento con IA

Cuando está habilitado, OpenAI:
- Mejora el título de la tarea
- Crea una descripción más detallada
- Sugiere prioridad apropiada
- Recomienda etiquetas relevantes
- Propone fechas de vencimiento

## 🛠️ Troubleshooting

### Error: "Token no válido"
- Verifica que el token de Notion/Todoist sea correcto
- Asegúrate de que la integración tenga permisos

### Error: "Usuario no mencionado"
- Verifica que `NOTION_USER_ID` sea correcto
- Asegúrate de estar mencionado en la página (@usuario)

### Error: "No se pudo crear tarea"
- Verifica el token de Todoist
- Comprueba que `TODOIST_PROJECT_ID` existe

### Webhook no funciona
- Verifica la URL del webhook en Notion
- Comprueba que el endpoint esté accesible públicamente
- Revisa los logs en Vercel

## 📊 Monitoreo

### Logs en Desarrollo:
```bash
npm run dev
# Los logs aparecerán en la consola
```

### Logs en Producción:
Ve a Vercel Dashboard > Tu Proyecto > Functions > Logs

## 🔐 Seguridad

- Nunca expongas tus tokens en el código
- Usa variables de entorno para configuración
- El archivo `.env.local` está en `.gitignore`
- Considera verificar firmas de webhook para mayor seguridad

## 📈 Próximos Pasos

- [ ] Verificación de firmas de webhook
- [ ] Soporte para más tipos de metadatos de Notion
- [ ] Integración con más servicios (Slack, Discord)
- [ ] Dashboard web para configuración
- [ ] Sincronización bidireccional

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request
