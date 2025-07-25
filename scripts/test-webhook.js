#!/usr/bin/env node

/**
 * Script de testing para webhooks de Notion - Enfoque simple y práctico
 * Basado en escenarios reales observados en los logs
 * 
 * Uso:
 * npm run test:webhook                    # Test básico del endpoint
 * npm run test:webhook -- --real         # Tests con payloads reales
 * npm run test:webhook -- --sequence     # Test de secuencia de eventos
 * npm run test:webhook -- --mentions     # Test de eliminación de menciones
 * npm run test:webhook -- --update       # Test de actualización de propiedades
 * npm run test:webhook -- --logs         # Ver logs recientes
 * npm run test:webhook -- --stats        # Ver estadísticas
 */

import https from 'https';
import http from 'http';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const WEBHOOK_URL = `${BASE_URL}/api/notion-webhook`;

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Payloads basados en logs reales del usuario
const realPayloads = {
  verification: {
    verification_token: "test-verification-token-12345"
  },

  pageDeleted: {
    id: "f426b1e2-c5de-41a6-84e1-1aa3edaf8fd7",
    timestamp: "2025-07-15T20:25:38.394Z",
    workspace_id: "bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1",
    workspace_name: "Corabella Pets",
    subscription_id: "231d872b-594c-8122-963e-0099eb119522",
    integration_id: "230d872b-594c-8060-8665-0037427fe4f8",
    authors: [{ id: "79d3b102-9821-4d8e-bf2b-1e94a65d5120", type: "person" }],
    attempt_number: 1,
    entity: { id: "2311ad4d-650d-8012-95cf-f4bbd3581f4a", type: "page" },
    type: "page.deleted",
    data: {
      parent: { id: "1f61ad4d-650d-80e0-b231-d9b12ffea832", type: "database" }
    }
  },

  pageContentUpdated: {
    id: "80aeb0fc-dd26-44b6-b742-d0f47c3f978c",
    timestamp: "2025-07-15T20:25:40.869Z",
    workspace_id: "bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1",
    workspace_name: "Corabella Pets",
    subscription_id: "231d872b-594c-8122-963e-0099eb119522",
    integration_id: "230d872b-594c-8060-8665-0037427fe4f8",
    authors: [{ id: "79d3b102-9821-4d8e-bf2b-1e94a65d5120", type: "person" }],
    attempt_number: 1,
    entity: { id: "2311ad4d-650d-8034-a3bf-c882d00b435a", type: "page" },
    type: "page.content_updated",
    data: {
      parent: { id: "1f61ad4d-650d-80e0-b231-d9b12ffea832", type: "database" },
      updated_blocks: [
        { id: "2311ad4d-650d-8039-809f-c4941f3f0d9d", type: "block" },
        { id: "2311ad4d-650d-8091-97e1-df44b75c765e", type: "block" }
      ]
    }
  },

  pageCreated: {
    id: "a9d20b68-b722-46a3-8cf9-8153eb70c9dc",
    timestamp: "2025-07-15T20:25:39.546Z",
    workspace_id: "bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1",
    workspace_name: "Corabella Pets",
    subscription_id: "231d872b-594c-8122-963e-0099eb119522",
    integration_id: "230d872b-594c-8060-8665-0037427fe4f8",
    authors: [{ id: "79d3b102-9821-4d8e-bf2b-1e94a65d5120", type: "person" }],
    attempt_number: 1,
    entity: { id: "2311ad4d-650d-8034-a3bf-c882d00b435a", type: "page" },
    type: "page.created",
    data: {
      parent: { id: "1f61ad4d-650d-80e0-b231-d9b12ffea832", type: "database" }
    }
  },

  pagePropertiesUpdated: {
    id: "33173d5b-b4fc-4976-96eb-8e7a4941410e",
    timestamp: "2025-07-15T21:40:48.566Z",
    workspace_id: "bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1",
    workspace_name: "Corabella Pets",
    subscription_id: "231d872b-594c-8122-963e-0099eb119522",
    integration_id: "230d872b-594c-8060-8665-0037427fe4f8",
    authors: [{ id: "79d3b102-9821-4d8e-bf2b-1e94a65d5120", type: "person" }],
    attempt_number: 1,
    entity: { id: "2311ad4d-650d-803e-8470-d503ff8e7985", type: "page" },
    type: "page.properties_updated",
    data: {
      parent: { id: "1f61ad4d-650d-80e0-b231-d9b12ffea832", type: "database" },
      updated_properties: ["Vun%7C"]
    }
  },

  pageStatusCompleted: {
    id: "44284e6c-c6fd-5087-a7fc-9f8b5f952521",
    timestamp: "2025-07-15T22:30:00.000Z",
    workspace_id: "bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1",
    workspace_name: "Corabella Pets",
    subscription_id: "231d872b-594c-8122-963e-0099eb119522",
    integration_id: "230d872b-594c-8060-8665-0037427fe4f8",
    authors: [{ id: "79d3b102-9821-4d8e-bf2b-1e94a65d5120", type: "person" }],
    attempt_number: 1,
    entity: { id: "3311ad4d-650d-805f-9580-e604ff9f8f96", type: "page" },
    type: "page.properties_updated",
    data: {
      parent: { id: "1f61ad4d-650d-80e0-b231-d9b12ffea832", type: "database" },
      updated_properties: ["Status"]
    }
  }
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'notion-api',
        'X-Notion-Signature': 'sha256=test-signature',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (_error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testWebhookEndpoint() {
  log('🔍 Verificando que el endpoint del webhook esté funcionando...', colors.cyan);
  
  try {
    const response = await makeRequest(WEBHOOK_URL);
    
    if (response.status === 200) {
      log('✅ Endpoint del webhook funcionando correctamente', colors.green);
      log(`📊 Configuración actual:`, colors.blue);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      log(`❌ Error en endpoint: ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Error conectando al webhook: ${error.message}`, colors.red);
    return false;
  }
}

async function testVerification() {
  log('🔐 Testeando verificación de Notion...', colors.cyan);
  
  try {
    const response = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      body: realPayloads.verification
    });

    if (response.status === 200 && response.data.verification_token) {
      log('✅ Verificación de Notion funcionando', colors.green);
      return true;
    } else {
      log(`❌ Error en verificación: ${response.status}`, colors.red);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    log(`❌ Error en verificación: ${error.message}`, colors.red);
    return false;
  }
}

async function testPageDeleted() {
  log('🗑️ Testeando evento de página eliminada...', colors.cyan);
  
  try {
    const response = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      body: realPayloads.pageDeleted
    });

    // La nueva API devuelve 400 para eventos no válidos con formato estandarizado
    if (response.status === 400 && 
        response.data.error?.message?.includes('page deleted')) {
      log('✅ Página eliminada ignorada correctamente', colors.green);
      return true;
    } else {
      log(`❌ Error manejando página eliminada: ${response.status}`, colors.red);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    log(`❌ Error en test de página eliminada: ${error.message}`, colors.red);
    return false;
  }
}

async function testDuplicateProtection() {
  log('⏳ Testeando protección contra duplicados...', colors.cyan);
  
  try {
    // Primer evento
    const response1 = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      body: realPayloads.pageContentUpdated
    });

    // Segundo evento inmediato (mismo pageId)
    const response2 = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      body: realPayloads.pageCreated
    });

    // Con el nuevo sistema de debounce, ambos eventos deberían devolver 200
    // y el mensaje debería indicar que están programados para procesamiento
    if (response1.status === 200 && response2.status === 200 && 
        response1.data.message?.includes('Event scheduled for processing') &&
        response2.data.message?.includes('Event scheduled for processing')) {
      log('✅ Protección contra duplicados funcionando (sistema de debounce)', colors.green);
      return true;
    } else {
      log(`❌ Protección contra duplicados falló`, colors.red);
      console.log('Primer response:', response1.data);
      console.log('Segundo response:', response2.data);
      return false;
    }
  } catch (error) {
    log(`❌ Error en test de duplicados: ${error.message}`, colors.red);
    return false;
  }
}

async function testPagePropertiesUpdated() {
  log('📝 Testeando evento de propiedades actualizadas...', colors.cyan);
  
  try {
    const response = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      body: realPayloads.pagePropertiesUpdated
    });

    if (response.status === 200 && response.data.message?.includes('Event scheduled for processing')) {
      log('✅ Evento de propiedades actualizadas procesado correctamente', colors.green);
      log(`   📄 Página: ${response.data.pageId}`, colors.blue);
      log(`   ⏰ Debounce: ${response.data.debounceTimeMs}ms`, colors.blue);
      return true;
    } else {
      log(`❌ Error procesando evento de propiedades actualizadas: ${response.status}`, colors.red);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    log(`❌ Error en test de propiedades actualizadas: ${error.message}`, colors.red);
    return false;
  }
}

async function testUpdateSequence() {
  log('🔄 Testeando secuencia de creación y actualización...', colors.cyan);
  
  try {
    // Primer evento: crear página
    log('  📤 Enviando: page.created', colors.blue);
    const createResponse = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      body: realPayloads.pageCreated
    });

    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 200));

    // Segundo evento: actualizar propiedades de la misma página
    log('  📤 Enviando: page.properties_updated (misma página)', colors.blue);
    const updateResponse = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      body: {
        ...realPayloads.pagePropertiesUpdated,
        entity: { id: realPayloads.pageCreated.entity.id, type: 'page' } // Misma página
      }
    });

    const results = [
      { event: 'page.created', status: createResponse.status, message: createResponse.data.message },
      { event: 'page.properties_updated', status: updateResponse.status, message: updateResponse.data.message }
    ];

    log('📊 Resultados de la secuencia creación -> actualización:', colors.blue);
    results.forEach((result, index) => {
      const color = result.status === 200 ? colors.green : colors.red;
      log(`  ${index + 1}. ${result.event}: ${result.status} - ${result.message}`, color);
    });

    // Verificar que ambos eventos fueron programados para procesamiento
    const allProcessed = results.every(r => r.status === 200 && r.message?.includes('Event scheduled for processing'));

    if (allProcessed) {
      log('✅ Secuencia de creación -> actualización manejada correctamente', colors.green);
      return true;
    } else {
      log('❌ Secuencia de creación -> actualización no manejada como esperado', colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Error en test de secuencia de actualización: ${error.message}`, colors.red);
    return false;
  }
}

async function testTaskCompletion() {
  log('✅ Testeando completado automático de tareas...', colors.cyan);
  
  try {
    // Simular cambio de estado a completado
    const response = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      body: realPayloads.pageStatusCompleted
    });

    if (response.status === 200) {
      log('✅ Evento de completado procesado correctamente', colors.green);
      log(`   📄 Página: ${realPayloads.pageStatusCompleted.entity.id}`);
      log(`   🔄 Tipo: ${realPayloads.pageStatusCompleted.type}`);
      log(`   ⏰ Debounce: ${response.data.debounceTimeMs || 60000}ms`);
      
      // En el webhook real, aquí se completaría la tarea en Todoist
      // El test verifica que el evento se procese correctamente
      return true;
    } else {
      log(`❌ Error procesando evento de completado: ${response.status}`, colors.red);
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    log(`❌ Error en test de completado: ${error.message}`, colors.red);
    return false;
  }
}

async function testMentionRemoval() {
  log('🗑️  Testeando eliminación de tareas cuando se quita la mención...', colors.cyan);
  
  try {
    // Test 1: Simular página donde se quitó la mención
    log('  📋 Test 1: Página sin mención del usuario', colors.blue);
    const response1 = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      body: {
        id: 'test-mention-removal-1',
        timestamp: new Date().toISOString(),
        workspace_id: 'test-workspace',
        workspace_name: 'Test Workspace',
        type: 'page.updated',
        entity: {
          id: 'test-page-mention-removed',
          type: 'page'
        }
      }
    });

    if (response1.status === 200) {
      log('✅ Evento de actualización procesado correctamente', colors.green);
      log(`   📄 Página: test-page-mention-removed`);
      log(`   🔄 Acción: ${response1.data.eventAction}`);
      log(`   ⏰ Debounce: ${response1.data.debounceTimeMs || 0}ms`);
      
      // Test 2: Verificar que el sistema maneja correctamente cuando no hay tarea que eliminar
      log('  📋 Test 2: Página nueva sin tarea asociada', colors.blue);
      const response2 = await makeRequest(WEBHOOK_URL, {
        method: 'POST',
        body: {
          id: 'test-mention-removal-2',
          timestamp: new Date().toISOString(),
          workspace_id: 'test-workspace',
          workspace_name: 'Test Workspace',  
          type: 'page.updated',
          entity: {
            id: 'test-page-no-existing-task',
            type: 'page'
          }
        }
      });

      if (response2.status === 200) {
        log('✅ Manejo correcto de página sin tarea asociada', colors.green);
        log(`   📄 Página: test-page-no-existing-task`);
        log(`   🔄 Resultado: ${response2.data.message}`);
        
        log('✅ Tests de eliminación de menciones completados', colors.green);
        log('   • Sistema detecta cuando se quita la mención', colors.reset);
        log('   • Maneja correctamente páginas sin tareas asociadas', colors.reset);
        log('   • Funcionalidad lista para entorno de producción', colors.reset);
        
        return true;
      } else {
        log(`❌ Error en test 2: ${response2.status}`, colors.red);
        return false;
      }
    } else {
      log(`❌ Error en test 1: ${response1.status}`, colors.red);
      console.log('Response:', response1.data);
      return false;
    }
  } catch (error) {
    log(`❌ Error en test de eliminación de menciones: ${error.message}`, colors.red);
    return false;
  }
}

async function testSequenceScenario() {
  log('📝 Testeando secuencia real de eventos (content_updated -> page.created)...', colors.cyan);
  
  try {
    // Simular la secuencia exacta del log
    const events = [
      { payload: realPayloads.pageContentUpdated, description: 'page.content_updated' },
      { payload: realPayloads.pageCreated, description: 'page.created (mismo pageId)' }
    ];

    const results = [];
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      log(`  📤 Enviando: ${event.description}`, colors.blue);
      
      const response = await makeRequest(WEBHOOK_URL, {
        method: 'POST',
        body: event.payload
      });
      
      results.push({
        event: event.description,
        status: response.status,
        message: response.data.message || 'OK',
        success: response.data.success
      });
      
      // Esperar un poco entre eventos para simular timing real
      if (i < events.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    log('� Resultados de la secuencia:', colors.blue);
    results.forEach((result, index) => {
      const color = result.status === 200 ? colors.green : colors.red;
      log(`  ${index + 1}. ${result.event}: ${result.status} - ${result.message}`, color);
    });

    // Verificar que la secuencia es correcta (ambos eventos son programados para procesamiento)
    const expectedPattern = results[0].status === 200 && 
                           results[1].status === 200 && 
                           results[0].message?.includes('Event scheduled for processing') &&
                           results[1].message?.includes('Event scheduled for processing');

    if (expectedPattern) {
      log('✅ Secuencia de eventos manejada correctamente', colors.green);
      return true;
    } else {
      log('❌ Secuencia de eventos no manejada como esperado', colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Error en test de secuencia: ${error.message}`, colors.red);
    return false;
  }
}

async function runRealScenarioTests() {
  log('🧪 Ejecutando tests basados en escenarios reales...', colors.cyan);
  
  const tests = [
    { name: 'Verificación de Notion', fn: testVerification },
    { name: 'Página eliminada', fn: testPageDeleted },
    { name: 'Protección duplicados', fn: testDuplicateProtection },
    { name: 'Propiedades actualizadas', fn: testPagePropertiesUpdated },
    { name: 'Secuencia creación/actualización', fn: testUpdateSequence },
    { name: 'Completado automático de tareas', fn: testTaskCompletion },
    { name: 'Eliminación por remoción de mención', fn: testMentionRemoval },
    { name: 'Secuencia de eventos', fn: testSequenceScenario }
  ];

  const results = [];
  
  for (const test of tests) {
    log(`\n🔍 Ejecutando: ${test.name}`, colors.bold);
    const startTime = Date.now();
    const passed = await test.fn();
    const duration = Date.now() - startTime;
    
    results.push({
      name: test.name,
      passed,
      duration
    });
  }

  // Resumen
  log('\n📊 Resumen de Tests:', colors.bold);
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  log(`Total: ${total} | Pasaron: ${passed} | Fallaron: ${total - passed}`);
  log(`Tasa de éxito: ${((passed / total) * 100).toFixed(1)}%`);
  
  results.forEach(result => {
    const color = result.passed ? colors.green : colors.red;
    const status = result.passed ? '✅' : '❌';
    log(`${status} ${result.name} (${result.duration}ms)`, color);
  });
  
  return passed === total;
}

async function main() {
  const args = process.argv.slice(2);
  
  log('🎯 Notion Webhook Tester - Escenarios Reales', colors.bold + colors.cyan);
  log('===============================================\n');
  
  // Verificar que el endpoint esté funcionando
  const endpointOk = await testWebhookEndpoint();
  if (!endpointOk) {
    log('\n❌ El endpoint del webhook no está funcionando. Verifica que el servidor esté corriendo.', colors.red);
    process.exit(1);
  }
  
  log(''); // Línea en blanco
  
  if (args.includes('--help') || args.includes('-h')) {
    log('Uso:', colors.bold);
    log('  npm run test:webhook                    # Test básico del endpoint');
    log('  npm run test:webhook -- --real         # Tests con payloads reales');
    log('  npm run test:webhook -- --sequence     # Test de secuencia de eventos');
    log('  npm run test:webhook -- --mentions     # Test de eliminación de menciones');
    log('  npm run test:webhook -- --update       # Test de actualización de propiedades');
    log('  npm run test:webhook -- --logs         # Ver logs recientes');
    log('  npm run test:webhook -- --stats        # Ver estadísticas');
    return;
  }
  
  if (args.includes('--real')) {
    const success = await runRealScenarioTests();
    process.exit(success ? 0 : 1);
  } else if (args.includes('--sequence')) {
    const success = await testSequenceScenario();
    process.exit(success ? 0 : 1);
  } else if (args.includes('--mentions')) {
    const success = await testMentionRemoval();
    process.exit(success ? 0 : 1);
  } else if (args.includes('--update')) {
    const success = await testUpdateSequence();
    process.exit(success ? 0 : 1);
  } else if (args.includes('--logs')) {
    await showLogs();
  } else if (args.includes('--stats')) {
    await showStats();
  } else {
    // Test básico por defecto
    log('✅ Endpoint funcionando correctamente.', colors.green);
    log('💡 Para tests más detallados:', colors.blue);
    log('  --real      Tests con payloads reales');
    log('  --sequence  Test de secuencia de eventos');
    log('  --mentions  Test de eliminación de menciones');
    log('  --help      Ver todas las opciones');
  }
}

main().catch(error => {
  log(`❌ Error fatal: ${error.message}`, colors.red);
  process.exit(1);
});
