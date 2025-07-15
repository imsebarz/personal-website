#!/usr/bin/env node

/**
 * Analizador de logs de webhook de Notion
 * 
 * Uso:
 * node scripts/analyze-webhook-logs.js [archivo.csv]
 * npm run analyze:webhook:logs
 */

const fs = require('fs');
const path = require('path');

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

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const entry = {};
    
    headers.forEach((header, index) => {
      entry[header] = values[index] || '';
    });
    
    return entry;
  });
}

function analyzeLogData(logs) {
  log('📊 ANÁLISIS DE LOGS DE WEBHOOK', colors.bold + colors.cyan);
  log('================================\n');

  // Estadísticas generales
  const total = logs.length;
  const successful = logs.filter(log => log.success === 'true').length;
  const failed = logs.filter(log => log.success === 'false').length;
  
  log(`📈 Estadísticas Generales:`, colors.bold);
  log(`   Total de requests: ${total}`);
  log(`   Exitosos: ${successful}`, successful > 0 ? colors.green : colors.red);
  log(`   Fallidos: ${failed}`, failed > 0 ? colors.red : colors.green);
  log(`   Tasa de éxito: ${((successful / total) * 100).toFixed(1)}%\n`);

  // Análisis por tipo de evento
  const eventTypes = {};
  logs.forEach(log => {
    const eventType = log.eventType || 'unknown';
    if (!eventTypes[eventType]) {
      eventTypes[eventType] = { total: 0, successful: 0, failed: 0 };
    }
    eventTypes[eventType].total++;
    if (log.success === 'true') {
      eventTypes[eventType].successful++;
    } else {
      eventTypes[eventType].failed++;
    }
  });

  log(`📋 Análisis por Tipo de Evento:`, colors.bold);
  Object.entries(eventTypes).forEach(([eventType, stats]) => {
    const successRate = ((stats.successful / stats.total) * 100).toFixed(1);
    const color = stats.successful === stats.total ? colors.green : 
                  stats.failed === stats.total ? colors.red : colors.yellow;
    
    log(`   ${eventType}:`, color);
    log(`     Total: ${stats.total}, Exitosos: ${stats.successful}, Fallidos: ${stats.failed}`);
    log(`     Tasa de éxito: ${successRate}%`);
  });
  log('');

  // Análisis de duración
  const durations = logs.map(log => parseInt(log.duration) || 0);
  const avgDuration = durations.length > 0 ? 
    (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) : 0;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  log(`⏱️ Análisis de Rendimiento:`, colors.bold);
  log(`   Duración promedio: ${avgDuration}ms`);
  log(`   Duración máxima: ${maxDuration}ms`);
  log(`   Duración mínima: ${minDuration}ms`);
  
  // Detectar requests con duration 0 (problema común)
  const zeroDuration = logs.filter(log => log.duration === '0' || log.duration === '').length;
  if (zeroDuration > 0) {
    log(`   ⚠️ Requests con duración 0: ${zeroDuration} (${((zeroDuration / total) * 100).toFixed(1)}%)`, colors.yellow);
  }
  log('');

  // Análisis de errores
  const errorsWithMessage = logs.filter(log => log.error && log.error.trim() !== '');
  
  if (errorsWithMessage.length > 0) {
    log(`❌ Análisis de Errores:`, colors.red + colors.bold);
    const errorTypes = {};
    errorsWithMessage.forEach(log => {
      const error = log.error.trim();
      errorTypes[error] = (errorTypes[error] || 0) + 1;
    });
    
    Object.entries(errorTypes).forEach(([error, count]) => {
      log(`   "${error}": ${count} occurrencias`, colors.red);
    });
    log('');
  }

  // User agents
  const userAgents = {};
  logs.forEach(log => {
    const ua = log.userAgent || 'unknown';
    userAgents[ua] = (userAgents[ua] || 0) + 1;
  });

  log(`🤖 User Agents:`, colors.bold);
  Object.entries(userAgents).forEach(([ua, count]) => {
    const color = ua === 'notion-api' ? colors.green : colors.yellow;
    log(`   ${ua}: ${count} requests`, color);
  });
  log('');

  // Análisis temporal
  if (logs.length > 1) {
    const timestamps = logs.map(log => new Date(log.timestamp)).sort((a, b) => a - b);
    const firstRequest = timestamps[0];
    const lastRequest = timestamps[timestamps.length - 1];
    const timespan = lastRequest - firstRequest;
    const requestsPerMinute = (logs.length / (timespan / 60000)).toFixed(2);

    log(`⏰ Análisis Temporal:`, colors.bold);
    log(`   Primer request: ${firstRequest.toLocaleString()}`);
    log(`   Último request: ${lastRequest.toLocaleString()}`);
    log(`   Duración total: ${Math.round(timespan / 1000)}s`);
    log(`   Requests por minuto: ${requestsPerMinute}`);
    log('');
  }

  // IDs de páginas únicas
  const uniquePageIds = new Set(logs.map(log => log.pageId).filter(id => id && id.trim() !== ''));
  log(`📄 Páginas Únicas Procesadas: ${uniquePageIds.size}`, colors.blue);
  
  if (uniquePageIds.size <= 10) {
    log(`   IDs de páginas:`, colors.blue);
    Array.from(uniquePageIds).forEach(pageId => {
      const pageEvents = logs.filter(log => log.pageId === pageId);
      const eventTypes = [...new Set(pageEvents.map(log => log.eventType))].join(', ');
      log(`     ${pageId}: ${pageEvents.length} eventos (${eventTypes})`);
    });
  }
  log('');

  // Problemas detectados
  log(`🔍 Problemas Detectados:`, colors.yellow + colors.bold);
  
  const problems = [];
  
  if (failed === total) {
    problems.push(`🚨 CRÍTICO: Todos los requests están fallando (${failed}/${total})`);
  } else if (failed > total * 0.5) {
    problems.push(`⚠️ ALTO: Más del 50% de requests fallan (${failed}/${total})`);
  }
  
  if (zeroDuration > total * 0.8) {
    problems.push(`⚠️ Duración 0: Muchos requests tienen duración 0 (posible problema de logging)`);
  }
  
  if (Object.keys(userAgents).length > 1 && !userAgents['notion-api']) {
    problems.push(`⚠️ User Agent: No se detecta 'notion-api' como user agent`);
  }
  
  if (problems.length === 0) {
    log(`   ✅ No se detectaron problemas críticos`, colors.green);
  } else {
    problems.forEach(problem => {
      log(`   ${problem}`, colors.red);
    });
  }
  log('');

  // Recomendaciones
  log(`💡 Recomendaciones:`, colors.cyan + colors.bold);
  
  if (failed > 0) {
    log(`   1. Revisar configuración del webhook en Notion`);
    log(`   2. Verificar variables de entorno (NOTION_USER_ID, TODOIST_PROJECT_ID)`);
    log(`   3. Comprobar que el endpoint esté procesando requests correctamente`);
  }
  
  if (zeroDuration > 0) {
    log(`   4. Investigar por qué algunos requests tienen duración 0`);
    log(`   5. Verificar que el sistema de logging esté funcionando`);
  }
  
  log(`   6. Ejecutar tests automatizados: npm run test:webhook:all`);
  log(`   7. Revisar dashboard: http://localhost:3000/webhook-dashboard.html`);
}

function main() {
  const args = process.argv.slice(2);
  let csvFile = args[0];
  
  // Si no se proporciona archivo, buscar en Downloads
  if (!csvFile) {
    const downloadsDir = path.join(require('os').homedir(), 'Downloads');
    const files = fs.readdirSync(downloadsDir)
      .filter(file => file.startsWith('webhook-logs-') && file.endsWith('.csv'))
      .sort()
      .reverse(); // Más reciente primero
    
    if (files.length > 0) {
      csvFile = path.join(downloadsDir, files[0]);
      log(`📂 Usando archivo más reciente: ${files[0]}`, colors.cyan);
    } else {
      log('❌ No se encontró archivo CSV de logs', colors.red);
      log('Uso: node scripts/analyze-webhook-logs.js [archivo.csv]');
      log('O exporta logs desde el dashboard primero');
      process.exit(1);
    }
  }

  if (!fs.existsSync(csvFile)) {
    log(`❌ Archivo no encontrado: ${csvFile}`, colors.red);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(csvFile, 'utf8');
    const logs = parseCSV(content);
    
    if (logs.length === 0) {
      log('❌ No se encontraron logs en el archivo', colors.red);
      process.exit(1);
    }
    
    analyzeLogData(logs);
    
    log(`\n📋 Análisis completado para ${logs.length} logs desde: ${path.basename(csvFile)}`, colors.green);
    
  } catch (error) {
    log(`❌ Error procesando archivo: ${error.message}`, colors.red);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
