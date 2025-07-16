#!/usr/bin/env node

/**
 * Script para probar el webhook de Todoist
 * Simula eventos de completado de tareas de Todoist
 */

import https from 'https';
import http from 'http';
import crypto from 'crypto';

// Configuración
const config = {
  // URL de tu webhook local
  webhookUrl: process.env.APP_URL || 'http://localhost:3000',
  
  // Secret del webhook (debe coincidir con TODOIST_WEBHOOK_SECRET)
  webhookSecret: process.env.TODOIST_WEBHOOK_SECRET || 'your_todoist_webhook_secret_here',
  
  // ID de página de Notion de prueba (formato válido)
  sampleNotionPageId: '12345678-1234-1234-1234-123456789abc',
};

// Payloads de prueba
const testPayloads = {
  taskCompleted: {
    event_name: "item:completed",
    user_id: "2671355",
    event_data: {
      added_by_uid: "2671355",
      assigned_by_uid: null,
      checked: true,
      child_order: 3,
      collapsed: false,
      content: "Revisar propuesta de diseño",
      description: `Revisar la propuesta de diseño para el nuevo proyecto.\n\nReferencia: https://notion.so/${config.sampleNotionPageId}`,
      added_at: "2025-01-15T10:33:38.000000Z",
      completed_at: "2025-01-15T14:25:12.000000Z",
      due: null,
      deadline: null,
      id: "6XR4GqQQCW6Gv9h4",
      is_deleted: false,
      labels: ["work", "design"],
      parent_id: null,
      priority: 3,
      project_id: "6XR4H993xv8H5qCR",
      responsible_uid: null,
      section_id: null,
      url: "https://app.todoist.com/app/task/6XR4GqQQCW6Gv9h4",
      user_id: "2671355",
      comment_count: 0,
      created_at: "2025-01-15T10:33:38.000000Z",
      creator_id: "2671355",
      assignee_id: null,
      assigner_id: null,
      is_completed: true,
      added_by_uid: "2671355",
      assigned_by_uid: null,
      responsible_uid: null,
      deadline: null,
      is_deleted: false
    },
    initiator: {
      email: "usuario@ejemplo.com",
      full_name: "Usuario de Prueba",
      id: "2671355",
      image_id: "ad38375bdb094286af59f1eab36d8f20",
      is_premium: true
    },
    triggered_at: "2025-01-15T14:25:12.000000Z",
    version: "10"
  },
  
  taskCompletedWithoutNotion: {
    event_name: "item:completed",
    user_id: "2671355",
    event_data: {
      id: "7YS5HrRRDX7Hw0i5",
      content: "Comprar leche",
      description: "Ir al supermercado y comprar leche",
      project_id: "6XR4H993xv8H5qCR",
      section_id: null,
      parent_id: null,
      order: 1,
      labels: ["personal"],
      priority: 1,
      due: null,
      url: "https://app.todoist.com/app/task/7YS5HrRRDX7Hw0i5",
      comment_count: 0,
      created_at: "2025-01-15T09:00:00.000000Z",
      creator_id: "2671355",
      assignee_id: null,
      assigner_id: null,
      is_completed: true,
      completed_at: "2025-01-15T15:30:00.000000Z",
      added_at: "2025-01-15T09:00:00.000000Z",
      added_by_uid: "2671355",
      assigned_by_uid: null,
      responsible_uid: null,
      checked: true,
      child_order: 1,
      collapsed: false,
      deadline: null,
      is_deleted: false,
      user_id: "2671355"
    },
    initiator: {
      email: "usuario@ejemplo.com",
      full_name: "Usuario de Prueba",
      id: "2671355",
      image_id: "ad38375bdb094286af59f1eab36d8f20",
      is_premium: true
    },
    triggered_at: "2025-01-15T15:30:00.000000Z",
    version: "10"
  },

  nonCompletionEvent: {
    event_name: "item:added",
    user_id: "2671355",
    event_data: {
      id: "8ZT6IsSSEY8Ix1j6",
      content: "Nueva tarea agregada",
      description: "Esta es una nueva tarea",
      project_id: "6XR4H993xv8H5qCR",
      is_completed: false,
      added_at: "2025-01-15T16:00:00.000000Z"
    },
    initiator: {
      email: "usuario@ejemplo.com",
      full_name: "Usuario de Prueba",
      id: "2671355"
    },
    triggered_at: "2025-01-15T16:00:00.000000Z",
    version: "10"
  }
};

// Función para crear firma HMAC
function createSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64');
}

// Función para realizar petición HTTP
function makeRequest(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    };
    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Función para colorear texto en consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función principal de prueba
async function runTests() {
  colorLog('\n🧪 Iniciando pruebas del webhook de Todoist\n', 'cyan');
  
  const webhookEndpoint = `${config.webhookUrl}/api/todoist-webhook`;
  
  // Verificar que la URL esté configurada
  if (!config.webhookUrl || config.webhookUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    colorLog('⚠️  Advertencia: Usando URL localhost en producción', 'yellow');
  }

  // Prueba 1: Tarea completada con referencia a Notion
  try {
    colorLog('📝 Prueba 1: Tarea completada con referencia a Notion', 'blue');
    
    const payload = JSON.stringify(testPayloads.taskCompleted);
    const signature = createSignature(payload, config.webhookSecret);
    
    const headers = {
      'User-Agent': 'Todoist-Webhooks',
      'X-Todoist-Hmac-SHA256': signature,
      'X-Todoist-Delivery-ID': 'test-delivery-1'
    };
    
    const response = await makeRequest(webhookEndpoint, payload, headers);
    
    colorLog(`   Estado: ${response.status}`, response.status === 200 ? 'green' : 'red');
    colorLog(`   Mensaje: ${response.data?.data?.message || response.data?.message || 'Sin mensaje'}`, 'cyan');
    if (response.data?.data?.notionPageId) {
      colorLog(`   Página de Notion: ${response.data.data.notionPageId}`, 'magenta');
    }
    
  } catch (error) {
    colorLog(`   ❌ Error: ${error.message}`, 'red');
  }

  // Prueba 2: Tarea completada sin referencia a Notion
  try {
    colorLog('\n📝 Prueba 2: Tarea completada sin referencia a Notion', 'blue');
    
    const payload = JSON.stringify(testPayloads.taskCompletedWithoutNotion);
    const signature = createSignature(payload, config.webhookSecret);
    
    const headers = {
      'User-Agent': 'Todoist-Webhooks',
      'X-Todoist-Hmac-SHA256': signature,
      'X-Todoist-Delivery-ID': 'test-delivery-2'
    };
    
    const response = await makeRequest(webhookEndpoint, payload, headers);
    
    colorLog(`   Estado: ${response.status}`, response.status === 200 ? 'green' : 'red');
    colorLog(`   Mensaje: ${response.data?.data?.message || response.data?.message || 'Sin mensaje'}`, 'cyan');
    
  } catch (error) {
    colorLog(`   ❌ Error: ${error.message}`, 'red');
  }

  // Prueba 3: Evento que no es de completado
  try {
    colorLog('\n📝 Prueba 3: Evento que no es de completado (debería ser ignorado)', 'blue');
    
    const payload = JSON.stringify(testPayloads.nonCompletionEvent);
    const signature = createSignature(payload, config.webhookSecret);
    
    const headers = {
      'User-Agent': 'Todoist-Webhooks',
      'X-Todoist-Hmac-SHA256': signature,
      'X-Todoist-Delivery-ID': 'test-delivery-3'
    };
    
    const response = await makeRequest(webhookEndpoint, payload, headers);
    
    colorLog(`   Estado: ${response.status}`, response.status === 200 ? 'green' : 'red');
    colorLog(`   Mensaje: ${response.data?.data?.message || response.data?.message || 'Sin mensaje'}`, 'cyan');
    
  } catch (error) {
    colorLog(`   ❌ Error: ${error.message}`, 'red');
  }

  // Prueba 4: Webhook sin firma (si el secret está configurado)
  if (config.webhookSecret && config.webhookSecret !== 'your_todoist_webhook_secret_here') {
    try {
      colorLog('\n📝 Prueba 4: Webhook sin firma válida (debería fallar)', 'blue');
      
      const payload = JSON.stringify(testPayloads.taskCompleted);
      
      const headers = {
        'User-Agent': 'Todoist-Webhooks',
        'X-Todoist-Delivery-ID': 'test-delivery-4'
        // Sin firma HMAC
      };
      
      const response = await makeRequest(webhookEndpoint, payload, headers);
      
      colorLog(`   Estado: ${response.status}`, response.status >= 400 ? 'green' : 'red');
      colorLog(`   Mensaje: ${response.data?.error || response.data?.message || 'Sin mensaje'}`, 'cyan');
      
    } catch (error) {
      colorLog(`   ❌ Error: ${error.message}`, 'red');
    }
  }

  // Prueba 5: Health check
  try {
    colorLog('\n🏥 Prueba 5: Health check', 'blue');
    
    // Hacer petición GET al endpoint
    const urlObj = new URL(webhookEndpoint);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const healthResponse = await new Promise((resolve, reject) => {
      const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    colorLog(`   Estado: ${healthResponse.status}`, healthResponse.status === 200 ? 'green' : 'red');
    colorLog(`   Mensaje: ${healthResponse.data?.message || 'Health check OK'}`, 'cyan');
    
  } catch (error) {
    colorLog(`   ❌ Error en health check: ${error.message}`, 'red');
  }

  colorLog('\n✅ Pruebas completadas', 'green');
  colorLog('\n📋 Para configurar el webhook en Todoist:', 'yellow');
  colorLog(`   URL del webhook: ${webhookEndpoint}`, 'cyan');
  colorLog(`   Eventos a configurar: item:completed`, 'cyan');
  if (config.webhookSecret !== 'your_todoist_webhook_secret_here') {
    colorLog(`   Secret configurado: ${config.webhookSecret.substring(0, 10)}...`, 'cyan');
  }
}

// Ejecutar pruebas
runTests()

export { runTests, testPayloads, createSignature };
