# Tests para Webhook de Notion

## ✅ Sistema Implementado y Funcionando

Los tests están organizados de manera **simple, atómica y fiel a los escenarios reales** observados en logs de producción.

## 🧪 Tests Implementados

### Tests Unitarios (Jest)
```bash
npm test                    # ✅ 8 tests pasando
npm run test:watch          # Modo watch
npm run test:coverage       # Con coverage
```

**Escenarios cubiertos:**
- ✅ Verificación de token de Notion
- ✅ Páginas eliminadas (ignoradas correctamente)
- ✅ Protección contra duplicados (debounce de 60s)
- ✅ Validación de headers de Notion
- ✅ Eventos no relevantes (ignorados)
- ✅ Manejo de errores (JSON inválido)
- ✅ Secuencia real: `content_updated` → `page.created`

### Tests de Integración
```bash
npm run test:webhook              # Test básico del endpoint
npm run test:webhook:real         # Tests con payloads reales
npm run test:webhook:sequence     # Test de secuencia específica
```

## 📊 Datos Reales Utilizados

Los tests usan **payloads extraídos directamente de tus logs**:

```json
{
  "type": "page.deleted",
  "entity": { "id": "2311ad4d-650d-8012-95cf-f4bbd3581f4a" },
  "workspace_name": "Corabella Pets"
}
```

## 🎯 Casos de Uso Verificados

### ✅ Flujo Normal
1. Evento `page.content_updated` → **Procesado exitosamente**
2. Evento `page.created` (mismo pageId) → **Rechazado por debounce**

### ✅ Casos Edge
- Headers inválidos → 400 error
- Páginas eliminadas → Ignoradas
- Eventos duplicados → Debounce funciona
- JSON malformado → Error manejado

## 🔧 Configuración Simple

- **Jest**: Solo lo esencial, sin complejidad
- **Mocks**: Simulan lógica real sin dependencias
- **Payloads**: Copiados de logs reales de producción
- **ES Modules**: Soporte nativo

## 📈 Resultados

```
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        0.8s
```

**Todos los escenarios reales están cubiertos y funcionando correctamente.**
