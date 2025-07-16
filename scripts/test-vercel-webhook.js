#!/usr/bin/env node

/**
 * Script de prueba para webhooks de Notion con debouncing mejorado para Vercel
 */

import { config } from '../src/lib/config.js';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/notion-webhook';
const TEST_PAGE_ID = process.env.TEST_PAGE_ID || 'test-page-id-123';

/**
 * Crea un payload de webhook de prueba
 */
function createTestPayload(pageId, eventType = 'page.updated') {
  return {
    entity: {
      id: pageId,
      type: 'page'
    },
    type: eventType,
    workspace_name: 'Test Workspace',
    timestamp: new Date().toISOString()
  };
}

/**
 * Envía un webhook de prueba
 */
async function sendWebhook(payload, label) {
  try {
    console.log(`🚀 Enviando webhook: ${label}`);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'notion-api',
        'X-Notion-Signature': 'test-signature'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log(`✅ Respuesta (${response.status}):`, {
      message: result.message,
      pageId: result.pageId,
      eventAction: result.eventAction,
      debounceTimeMs: result.debounceTimeMs
    });

    return result;
  } catch (error) {
    console.error(`❌ Error enviando webhook ${label}:`, error.message);
    return null;
  }
}

/**
 * Prueba de procesamiento inmediato
 */
async function testImmediateProcessing() {
  console.log('\n📋 Test 1: Procesamiento inmediato (sin debounce)');
  console.log('=' .repeat(60));
  
  const payload = createTestPayload(`${TEST_PAGE_ID}-immediate`);
  const result = await sendWebhook(payload, 'Evento único');
  
  if (result && result.message.includes('processed successfully')) {
    console.log('✅ Test PASÓ: Evento procesado inmediatamente');
  } else {
    console.log('❌ Test FALLÓ: Evento no procesado inmediatamente');
  }
}

/**
 * Prueba de debouncing
 */
async function testDebouncing() {
  console.log('\n📋 Test 2: Debouncing (eventos rápidos)');
  console.log('=' .repeat(60));
  
  const pageId = `${TEST_PAGE_ID}-debounce`;
  
  // Primer evento - debería procesarse inmediatamente
  console.log('\n🔸 Enviando primer evento...');
  const firstResult = await sendWebhook(createTestPayload(pageId), 'Primer evento');
  
  // Esperar un poco y enviar segundo evento - debería aplicar debounce
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n🔸 Enviando segundo evento (debería aplicar debounce)...');
  const secondResult = await sendWebhook(createTestPayload(pageId), 'Segundo evento');
  
  if (firstResult && firstResult.message.includes('processed successfully') &&
      secondResult && secondResult.message.includes('debounced')) {
    console.log('✅ Test PASÓ: Debouncing funcionando correctamente');
  } else {
    console.log('❌ Test FALLÓ: Debouncing no funcionando como esperado');
    console.log('  Primer resultado:', firstResult?.message);
    console.log('  Segundo resultado:', secondResult?.message);
  }
}

/**
 * Prueba de múltiples páginas
 */
async function testMultiplePages() {
  console.log('\n📋 Test 3: Múltiples páginas (sin interferencia)');
  console.log('=' .repeat(60));
  
  const promises = [];
  for (let i = 1; i <= 3; i++) {
    const pageId = `${TEST_PAGE_ID}-multi-${i}`;
    const payload = createTestPayload(pageId);
    promises.push(sendWebhook(payload, `Página ${i}`));
  }
  
  const results = await Promise.all(promises);
  const allProcessed = results.every(r => r && r.message.includes('processed successfully'));
  
  if (allProcessed) {
    console.log('✅ Test PASÓ: Múltiples páginas procesadas correctamente');
  } else {
    console.log('❌ Test FALLÓ: No todas las páginas fueron procesadas');
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🧪 Iniciando pruebas de webhook con debouncing mejorado para Vercel');
  console.log('=' .repeat(80));
  console.log(`📍 URL del webhook: ${WEBHOOK_URL}`);
  console.log(`🆔 ID de página base: ${TEST_PAGE_ID}`);
  console.log(`⏱️  Tiempo de debounce configurado: ${config.webhooks.debounceTime}ms`);
  
  try {
    await testImmediateProcessing();
    await testDebouncing();
    await testMultiplePages();
    
    console.log('\n🎉 Todas las pruebas completadas');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
