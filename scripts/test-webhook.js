#!/usr/bin/env node

/**
 * Script de testing para webhooks de Notion
 * 
 * Uso:
 * npm run test:webhook                    # Ejecutar test básico
 * npm run test:webhook -- --all          # Ejecutar todos los tests
 * npm run test:webhook -- --load 20      # Test de carga con 20 requests
 * npm run test:webhook -- --scenario page_created_success
 * npm run test:webhook -- --logs         # Ver logs recientes
 * npm run test:webhook -- --stats        # Ver estadísticas
 */

import https from 'https';
import http from 'http';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const WEBHOOK_URL = `${BASE_URL}/api/notion-webhook`;
const LOGS_URL = `${BASE_URL}/api/webhook-logs`;

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

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

async function runSpecificTest(scenarioName) {
  log(`🧪 Ejecutando test: ${scenarioName}`, colors.cyan);
  
  try {
    const response = await makeRequest(LOGS_URL, {
      method: 'POST',
      body: {
        action: 'run-test',
        scenario: scenarioName
      }
    });

    if (response.status === 200) {
      const result = response.data.result;
      
      if (result.passed) {
        log(`✅ Test PASÓ: ${result.scenario}`, colors.green);
        log(`   Descripción: ${result.description}`);
        log(`   Outcome: ${result.actualOutcome} (esperado: ${result.expectedOutcome})`);
        log(`   Duración: ${result.duration}ms`);
      } else {
        log(`❌ Test FALLÓ: ${result.scenario}`, colors.red);
        log(`   Descripción: ${result.description}`);
        log(`   Outcome: ${result.actualOutcome} (esperado: ${result.expectedOutcome})`);
        log(`   Duración: ${result.duration}ms`);
        
        if (result.validation.errors.length > 0) {
          log(`   Errores:`, colors.red);
          result.validation.errors.forEach(error => {
            log(`     - ${error}`, colors.red);
          });
        }
      }
    } else {
      log(`❌ Error ejecutando test: ${response.status}`, colors.red);
      console.log(response.data);
    }
  } catch (error) {
    log(`❌ Error en test: ${error.message}`, colors.red);
  }
}

async function runAllTests() {
  log('🧪 Ejecutando todos los tests...', colors.cyan);
  
  try {
    const response = await makeRequest(LOGS_URL, {
      method: 'POST',
      body: {
        action: 'run-all-tests'
      }
    });

    if (response.status === 200) {
      const summary = response.data.summary;
      
      log(`📊 Resumen de Tests:`, colors.bold);
      log(`   Total: ${summary.total}`);
      log(`   Pasaron: ${summary.passed}`, colors.green);
      log(`   Fallaron: ${summary.failed}`, colors.red);
      log(`   Tasa de éxito: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
      
      log(`\n📋 Resultados detallados:`, colors.blue);
      summary.results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        const color = result.passed ? colors.green : colors.red;
        log(`${status} ${result.scenario} (${result.duration}ms)`, color);
        
        if (!result.passed && result.validation.errors.length > 0) {
          result.validation.errors.forEach(error => {
            log(`     └─ ${error}`, colors.red);
          });
        }
      });
    } else {
      log(`❌ Error ejecutando tests: ${response.status}`, colors.red);
    }
  } catch (error) {
    log(`❌ Error en tests: ${error.message}`, colors.red);
  }
}

async function showLogs() {
  log('📋 Obteniendo logs recientes...', colors.cyan);
  
  try {
    const response = await makeRequest(`${LOGS_URL}?action=logs`);
    
    if (response.status === 200) {
      const { logs, total } = response.data;
      
      log(`📊 Últimos ${logs.length} logs (total: ${total}):`, colors.bold);
      
      logs.slice(0, 10).forEach(logEntry => {
        const status = logEntry.processing.success ? '✅' : '❌';
        const timestamp = new Date(logEntry.timestamp).toLocaleString();
        const eventType = logEntry.payload?.type || 'unknown';
        const pageId = logEntry.payload?.entity?.id || logEntry.payload?.page?.id || 'none';
        
        log(`${status} ${timestamp} | ${eventType} | ${pageId} | ${logEntry.processing.duration}ms`);
        
        if (!logEntry.processing.success && logEntry.processing.error) {
          log(`     └─ Error: ${logEntry.processing.error}`, colors.red);
        }
        
        if (logEntry.processing.skipReason) {
          log(`     └─ Skipped: ${logEntry.processing.skipReason}`, colors.yellow);
        }
      });
    } else {
      log(`❌ Error obteniendo logs: ${response.status}`, colors.red);
    }
  } catch (error) {
    log(`❌ Error obteniendo logs: ${error.message}`, colors.red);
  }
}

async function showStats() {
  log('📊 Obteniendo estadísticas...', colors.cyan);
  
  try {
    const response = await makeRequest(`${LOGS_URL}?action=stats`);
    
    if (response.status === 200) {
      const { stats } = response.data;
      
      log(`📈 Estadísticas del Webhook:`, colors.bold);
      log(`   Total de requests: ${stats.total}`);
      log(`   Exitosos: ${stats.successful}`, colors.green);
      log(`   Fallidos: ${stats.failed}`, colors.red);
      log(`   Tasa de éxito: ${stats.successRate}`, colors.blue);
      log(`   Tiempo promedio: ${stats.averageProcessingTime}ms`);
      
      log(`\n📋 Tipos de eventos:`, colors.blue);
      Object.entries(stats.eventTypes).forEach(([type, count]) => {
        log(`   ${type}: ${count}`);
      });
      
      log(`\n🤖 User Agents:`, colors.blue);
      Object.entries(stats.userAgents).forEach(([ua, count]) => {
        log(`   ${ua}: ${count}`);
      });
    } else {
      log(`❌ Error obteniendo estadísticas: ${response.status}`, colors.red);
    }
  } catch (error) {
    log(`❌ Error obteniendo estadísticas: ${error.message}`, colors.red);
  }
}

async function listScenarios() {
  log('📋 Scenarios de testing disponibles:', colors.cyan);
  
  try {
    const response = await makeRequest(`${LOGS_URL}?action=test-scenarios`);
    
    if (response.status === 200) {
      const { scenarios } = response.data;
      
      scenarios.forEach(scenario => {
        log(`\n🧪 ${scenario.name}`, colors.bold);
        log(`   Descripción: ${scenario.description}`);
        log(`   Outcome esperado: ${scenario.expectedOutcome}`, colors.blue);
        if (scenario.expectedSkipReason) {
          log(`   Razón de skip: ${scenario.expectedSkipReason}`, colors.yellow);
        }
      });
    } else {
      log(`❌ Error obteniendo scenarios: ${response.status}`, colors.red);
    }
  } catch (error) {
    log(`❌ Error obteniendo scenarios: ${error.message}`, colors.red);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  log('🎯 Notion Webhook Tester', colors.bold + colors.cyan);
  log('================================\n');
  
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
    log('  npm run test:webhook -- --all          # Ejecutar todos los tests');
    log('  npm run test:webhook -- --load N       # Test de carga con N requests');
    log('  npm run test:webhook -- --scenario X   # Ejecutar scenario específico');
    log('  npm run test:webhook -- --logs         # Ver logs recientes');
    log('  npm run test:webhook -- --stats        # Ver estadísticas');
    log('  npm run test:webhook -- --scenarios    # Listar scenarios disponibles');
    return;
  }
  
  if (args.includes('--all')) {
    await runAllTests();
  } else if (args.includes('--load')) {
    const loadIndex = args.indexOf('--load');
    const count = parseInt(args[loadIndex + 1]) || 10;
    await runLoadTest(count);
  } else if (args.includes('--scenario')) {
    const scenarioIndex = args.indexOf('--scenario');
    const scenarioName = args[scenarioIndex + 1];
    if (scenarioName) {
      await runSpecificTest(scenarioName);
    } else {
      log('❌ Debes especificar el nombre del scenario', colors.red);
      await listScenarios();
    }
  } else if (args.includes('--logs')) {
    await showLogs();
  } else if (args.includes('--stats')) {
    await showStats();
  } else if (args.includes('--scenarios')) {
    await listScenarios();
  } else {
    // Test básico por defecto
    log('✅ Endpoint funcionando correctamente. Para más opciones usa --help', colors.green);
  }
}

main().catch(error => {
  log(`❌ Error fatal: ${error.message}`, colors.red);
  process.exit(1);
});
