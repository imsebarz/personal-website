#!/usr/bin/env node

/**
 * Script de prueba para la integración Notion-Todoist
 * Simula un webhook de Notion para probar la funcionalidad
 */

import axios from 'axios';

// Configuración
const API_URL = process.env.APP_URL || 'http://localhost:3000';
const WEBHOOK_ENDPOINT = `${API_URL}/api/notion-webhook`;

// Datos de prueba simulando un webhook de Notion
const mockWebhookPayload = {
  object: "page",
  event_ts: new Date().toISOString(),
  event_id: "test-event-" + Date.now(),
  event_type: "page.property_updated",
  subscription_id: "test-subscription",
  user_id: "test-user",
  workspace_id: "test-workspace",
  page: {
    id: "test-page-id-" + Date.now(),
    created_time: new Date().toISOString(),
    last_edited_time: new Date().toISOString(),
    created_by: {
      object: "user",
      id: "test-user-id"
    },
    last_edited_by: {
      object: "user", 
      id: "test-user-id"
    },
    parent: {
      type: "database_id",
      database_id: "test-database-id"
    },
    archived: false,
    properties: {
      "Title": {
        type: "title",
        title: [
          {
            type: "text",
            text: {
              content: "Tarea de prueba desde Notion",
              link: null
            },
            plain_text: "Tarea de prueba desde Notion"
          }
        ]
      },
      "Status": {
        type: "select",
        select: {
          id: "test-status-id",
          name: "To Do",
          color: "red"
        }
      },
      "Priority": {
        type: "select",
        select: {
          id: "test-priority-id",
          name: "High",
          color: "red"
        }
      },
      "Due Date": {
        type: "date",
        date: {
          start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: null,
          time_zone: null
        }
      },
      "Tags": {
        type: "multi_select",
        multi_select: [
          {
            id: "test-tag-1",
            name: "importante",
            color: "red"
          },
          {
            id: "test-tag-2", 
            name: "desarrollo",
            color: "blue"
          }
        ]
      }
    },
    url: "https://www.notion.so/test-page-url",
    public_url: null
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
        'notion-version': '2022-06-28'
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
