#!/usr/bin/env node

/**
 * Script de prueba para la integración Notion-Todoist
 * Simula un webhook de Notion para probar la funcionalidad
 */

import axios from 'axios';

// Configuración
const API_URL = process.env.APP_URL || 'http://localhost:3000';
const WEBHOOK_ENDPOINT = `${API_URL}/api/notion-webhook`;

// Datos de prueba con formato real de Notion (basado en logs)
const mockWebhookPayload = {
  id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString(),
  workspace_id: 'bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1',
  workspace_name: 'Test Workspace',
  subscription_id: '231d872b-594c-8122-963e-0099eb119522',
  integration_id: '230d872b-594c-8060-8665-0037427fe4f8',
  authors: [
    {
      id: '79d3b102-9821-4d8e-bf2b-1e94a65d5120',
      type: 'person'
    }
  ],
  attempt_number: 1,
  entity: {
    id: `test-page-${Date.now()}`,
    type: 'page'
  },
  type: 'page.created',
  data: {
    parent: {
      id: '1f61ad4d-650d-80e0-b231-d9b12ffea832',
      type: 'database'
    }
  }
};

async function testWebhook() {
  console.log('🧪 Iniciando prueba de webhook Notion-Todoist...\n');
  
  try {
    // 1. Verificar que el endpoint esté funcionando
    console.log('1️⃣ Verificando estado del endpoint...');
    const healthResponse = await axios.get(WEBHOOK_ENDPOINT);
    console.log('✅ Endpoint funcionando:', healthResponse.data.message);
    console.log('📋 Configuración:', healthResponse.data.configuration);
    console.log('');

    // 2. Enviar webhook de prueba
    console.log('2️⃣ Enviando webhook de prueba...');
    console.log('📤 URL:', WEBHOOK_ENDPOINT);
    console.log('📦 Payload:', JSON.stringify(mockWebhookPayload, null, 2));
    console.log('');

    const webhookResponse = await axios.post(WEBHOOK_ENDPOINT, mockWebhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'notion-version': '2022-06-28',
        'user-agent': 'notion-api',
        'x-notion-signature': 'test-signature-123'
      }
    });

    console.log('3️⃣ Respuesta del webhook:');
    console.log('📊 Estado:', webhookResponse.status);
    console.log('📋 Respuesta:', JSON.stringify(webhookResponse.data, null, 2));

    if (webhookResponse.data.success) {
      console.log('\n🎉 ¡Prueba exitosa!');
      if (webhookResponse.data.todoistTaskId) {
        console.log(`✅ Tarea creada en Todoist: ${webhookResponse.data.todoistTaskId}`);
      }
      if (webhookResponse.data.enhancedWithAI) {
        console.log('🤖 Tarea enriquecida con IA');
      }
    } else {
      console.log('\n❌ La prueba falló');
      console.log('🔍 Error:', webhookResponse.data.error);
    }

  } catch (error) {
    console.error('\n💥 Error durante la prueba:');
    
    if (error.response) {
      console.error('📊 Estado HTTP:', error.response.status);
      console.error('📋 Respuesta:', error.response.data);
    } else if (error.request) {
      console.error('🌐 No se pudo conectar al servidor');
      console.error('🔍 Asegúrate de que el servidor esté ejecutándose en:', API_URL);
    } else {
      console.error('🔍 Error:', error.message);
    }
  }
}

// Función para probar solo la creación de tareas sin webhook
async function testDirectTaskCreation() {
  console.log('🧪 Probando creación directa de tareas...\n');

  const testPageContent = {
    title: "Tarea de prueba directa",
    content: "Esta es una tarea creada directamente para probar la funcionalidad sin webhook de Notion.",
    url: "https://notion.so/test-page",
    priority: 3,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: ["prueba", "desarrollo"]
  };

  try {
    const response = await axios.post(`${API_URL}/api/notion-webhook/test-direct`, testPageContent, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Respuesta:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--direct')) {
    await testDirectTaskCreation();
  } else {
    await testWebhook();
  }
}

main().catch(console.error);
