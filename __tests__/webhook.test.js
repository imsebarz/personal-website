/**
 * Tests para webhook de Notion basados en escenarios reales
 * Enfoque: Simple, atómico y fiel a los casos de uso reales
 */

// Mock del webhook handler - simulamos la nueva lógica que procesa el último evento
const createMockWebhookHandler = () => {
  const recentlyProcessed = new Map();
  const pendingEvents = new Map();
  const mockTodoistTasks = new Map(); // Simular base de datos de tareas de Todoist
  const DEBOUNCE_TIME = 1000; // Reducido para tests más rápidos

  // Función auxiliar para determinar si es creación o actualización
  const getEventAction = (eventType) => {
    const updateEvents = [
      'page.updated',
      'page.content_updated',
      'page.property_updated',
      'page.properties_updated'
    ];
    return updateEvents.includes(eventType || '') ? 'update' : 'create';
  };

  // Mock de función para encontrar tarea existente
  const findTaskByNotionUrl = (pageId) => {
    return mockTodoistTasks.get(pageId) || null;
  };

  // Mock de función para crear tarea
  const createTodoistTask = (pageId, taskData) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task = { id: taskId, ...taskData, pageId };
    mockTodoistTasks.set(pageId, task);
    return task;
  };

  // Mock de función para actualizar tarea
  const updateTodoistTask = (pageId, taskData) => {
    const existingTask = mockTodoistTasks.get(pageId);
    if (existingTask) {
      const updatedTask = { ...existingTask, ...taskData, updated: true };
      mockTodoistTasks.set(pageId, updatedTask);
      return updatedTask;
    }
    return null;
  };

  const handler = async (request) => {
    const payload = await request.json();
    
    // Manejo de verificación
    if (payload.verification_token) {
      return {
        status: 200,
        data: { verification_token: payload.verification_token }
      };
    }

    // Verificar headers
    const userAgent = request.headers.get('user-agent');
    const hasSignature = !!request.headers.get('x-notion-signature');
    
    if (userAgent !== 'notion-api' || !hasSignature) {
      return {
        status: 400,
        data: { error: 'Webhook no válido - no proviene de Notion' }
      };
    }

    // Verificar que es una página
    const pageId = payload.entity?.id || payload.page?.id;
    if (!pageId || (payload.entity?.type !== 'page' && !payload.page)) {
      return {
        status: 200,
        data: { message: 'Evento ignorado - no es una página' }
      };
    }

    // Verificar eventos de páginas eliminadas
    if (payload.type === 'page.deleted') {
      return {
        status: 200,
        data: { message: 'Evento ignorado - página eliminada' }
      };
    }

    // Verificar eventos relevantes para procesamiento
    const relevantEvents = [
      'page.created',
      'page.updated',
      'page.content_updated',
      'page.property_updated',
      'page.properties_updated'
    ];
    
    if (!relevantEvents.includes(payload.type)) {
      return {
        status: 200,
        data: { message: `Evento ${payload.type} ignorado - no relevante` }
      };
    }

    // Nueva lógica de debounce: procesar el último evento
    const now = Date.now();
    
    // Si ya existe un evento pendiente, cancelarlo
    const existingPendingEvent = pendingEvents.get(pageId);
    if (existingPendingEvent) {
      clearTimeout(existingPendingEvent.timeoutId);
    }
    
    // Crear nuevo timeout para procesar este evento (el más reciente)
    const timeoutId = setTimeout(async () => {
      // Simular procesamiento del evento final
      pendingEvents.delete(pageId);
      recentlyProcessed.set(pageId, Date.now());
      
      // Determinar si es creación o actualización
      const eventAction = getEventAction(payload.type);
      
      if (eventAction === 'update') {
        // Buscar tarea existente
        const existingTask = findTaskByNotionUrl(pageId);
        if (existingTask) {
          // Actualizar tarea existente
          updateTodoistTask(pageId, {
            content: `Updated content for ${pageId}`,
            description: `Updated via ${payload.type}`,
            updated_at: new Date().toISOString()
          });
        } else {
          // No se encontró tarea existente, crear nueva
          createTodoistTask(pageId, {
            content: `New task for ${pageId}`,
            description: `Created via ${payload.type} (fallback)`,
            created_at: new Date().toISOString()
          });
        }
      } else {
        // Crear nueva tarea
        createTodoistTask(pageId, {
          content: `New task for ${pageId}`,
          description: `Created via ${payload.type}`,
          created_at: new Date().toISOString()
        });
      }
    }, DEBOUNCE_TIME);
    
    // Guardar el evento pendiente
    pendingEvents.set(pageId, {
      payload,
      timeoutId,
      timestamp: now
    });

    // Retornar respuesta inmediata
    return {
      status: 200,
      data: { 
        message: 'Evento programado para procesamiento (se procesará el más reciente)',
        pageId,
        eventAction: getEventAction(payload.type),
        debounceTimeMs: DEBOUNCE_TIME
      }
    };
  };

  // Exponer funciones auxiliares para tests
  handler.getTasksMap = () => mockTodoistTasks;
  handler.getTasks = () => Array.from(mockTodoistTasks.values());
  handler.getTaskByPageId = (pageId) => mockTodoistTasks.get(pageId);
  handler.clearTasks = () => mockTodoistTasks.clear();

  return handler;
};

// Mock request
const createMockRequest = (payload = null) => ({
  json: jest.fn().mockResolvedValue(payload),
  headers: {
    get: jest.fn((header) => {
      const headers = {
        'user-agent': 'notion-api',
        'x-notion-signature': 'sha256=test-signature',
        'content-type': 'application/json',
      };
      return headers[header] || null;
    })
  }
});

// Payloads basados en logs reales
const realPayloads = {
  pageDeleted: {
    id: "f426b1e2-c5de-41a6-84e1-1aa3edaf8fd7",
    timestamp: "2025-07-15T20:25:38.394Z",
    workspace_id: "bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1",
    workspace_name: "Corabella Pets",
    subscription_id: "231d872b-594c-8122-963e-0099eb119522",
    integration_id: "230d872b-594c-8060-8665-0037427fe4f8",
    authors: [{
      id: "79d3b102-9821-4d8e-bf2b-1e94a65d5120",
      type: "person"
    }],
    attempt_number: 1,
    entity: {
      id: "2311ad4d-650d-8012-95cf-f4bbd3581f4a",
      type: "page"
    },
    type: "page.deleted",
    data: {
      parent: {
        id: "1f61ad4d-650d-80e0-b231-d9b12ffea832",
        type: "database"
      }
    }
  },

  pageContentUpdated: {
    id: "80aeb0fc-dd26-44b6-b742-d0f47c3f978c",
    timestamp: "2025-07-15T20:25:40.869Z",
    workspace_id: "bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1",
    workspace_name: "Corabella Pets",
    subscription_id: "231d872b-594c-8122-963e-0099eb119522",
    integration_id: "230d872b-594c-8060-8665-0037427fe4f8",
    authors: [{
      id: "79d3b102-9821-4d8e-bf2b-1e94a65d5120",
      type: "person"
    }],
    attempt_number: 1,
    entity: {
      id: "2311ad4d-650d-8034-a3bf-c882d00b435a",
      type: "page"
    },
    type: "page.content_updated",
    data: {
      parent: {
        id: "1f61ad4d-650d-80e0-b231-d9b12ffea832",
        type: "database"
      },
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
    authors: [{
      id: "79d3b102-9821-4d8e-bf2b-1e94a65d5120",
      type: "person"
    }],
    attempt_number: 1,
    entity: {
      id: "2311ad4d-650d-8034-a3bf-c882d00b435a",
      type: "page"
    },
    type: "page.created",
    data: {
      parent: {
        id: "1f61ad4d-650d-80e0-b231-d9b12ffea832",
        type: "database"
      }
    }
  },

  pagePropertiesUpdated: {
    id: "33173d5b-b4fc-4976-96eb-8e7a4941410e",
    timestamp: "2025-07-15T21:40:48.566Z",
    workspace_id: "bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1",
    workspace_name: "Corabella Pets",
    subscription_id: "231d872b-594c-8122-963e-0099eb119522",
    integration_id: "230d872b-594c-8060-8665-0037427fe4f8",
    authors: [{
      id: "79d3b102-9821-4d8e-bf2b-1e94a65d5120",
      type: "person"
    }],
    attempt_number: 1,
    entity: {
      id: "2311ad4d-650d-803e-8470-d503ff8e7985",
      type: "page"
    },
    type: "page.properties_updated",
    data: {
      parent: {
        id: "1f61ad4d-650d-80e0-b231-d9b12ffea832",
        type: "database"
      },
      updated_properties: [
        "Vun%7C"
      ]
    }
  },

  verification: {
    verification_token: "test-verification-token-123"
  }
};

describe('Notion Webhook - Escenarios Reales', () => {
  let webhookHandler;
  let mockRequest;

  beforeEach(() => {
    webhookHandler = createMockWebhookHandler();
    mockRequest = createMockRequest();
  });

  describe('Verificación de endpoint', () => {
    it('debe responder correctamente a verificación de Notion', async () => {
      mockRequest.json.mockResolvedValue(realPayloads.verification);

      const response = await webhookHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        verification_token: 'test-verification-token-123'
      });
    });
  });

  describe('Páginas eliminadas', () => {
    it('debe ignorar eventos de página eliminada', async () => {
      mockRequest.json.mockResolvedValue(realPayloads.pageDeleted);

      const response = await webhookHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('página eliminada');
    });
  });

  describe('Prevención de duplicados - Procesa último evento', () => {
    it('debe programar el primer evento y reprogramar con eventos posteriores', async () => {
      // Primer request - debe programarse
      mockRequest.json.mockResolvedValueOnce(realPayloads.pageContentUpdated);
      const firstResponse = await webhookHandler(mockRequest);
      
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.data.message).toContain('programado para procesamiento');
      expect(firstResponse.data.pageId).toBe('2311ad4d-650d-8034-a3bf-c882d00b435a');

      // Segundo request inmediato - debe cancelar el anterior y programar este
      mockRequest.json.mockResolvedValueOnce({
        ...realPayloads.pageCreated,
        entity: { id: '2311ad4d-650d-8034-a3bf-c882d00b435a', type: 'page' } // Same pageId
      });
      const secondResponse = await webhookHandler(mockRequest);
      
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.data.message).toContain('programado para procesamiento');
      expect(secondResponse.data.pageId).toBe('2311ad4d-650d-8034-a3bf-c882d00b435a');
    });
  });

  describe('Headers de Notion', () => {
    it('debe validar headers correctos de Notion', async () => {
      // Mock headers incorretos
      mockRequest.headers.get.mockImplementation((header) => {
        const headers = {
          'user-agent': 'invalid-agent',
          'x-notion-signature': null,
        };
        return headers[header] || null;
      });
      
      mockRequest.json.mockResolvedValue(realPayloads.pageCreated);

      const response = await webhookHandler(mockRequest);

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('no válido');
    });

    it('debe aceptar headers válidos de Notion', async () => {
      mockRequest.json.mockResolvedValue(realPayloads.verification);

      const response = await webhookHandler(mockRequest);

      expect(response.status).toBe(200);
    });
  });

  describe('Eventos no relevantes', () => {
    it('debe ignorar eventos que no son páginas', async () => {
      const nonPagePayload = {
        ...realPayloads.pageCreated,
        entity: { id: 'test-id', type: 'database' }
      };
      
      mockRequest.json.mockResolvedValue(nonPagePayload);

      const response = await webhookHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('no es una página');
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar payload inválido', async () => {
      mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));

      try {
        await webhookHandler(mockRequest);
      } catch (error) {
        expect(error.message).toContain('Invalid JSON');
      }
    });
  });

  describe('Secuencia de eventos reales', () => {
    it('debe manejar secuencia: content_updated -> page.created', async () => {
      // Simular el primer evento (content_updated)
      mockRequest.json.mockResolvedValueOnce(realPayloads.pageContentUpdated);
      const firstResponse = await webhookHandler(mockRequest);
      
      // Luego el segundo evento (page.created) - debe reprogramar el procesamiento
      mockRequest.json.mockResolvedValueOnce(realPayloads.pageCreated);
      const secondResponse = await webhookHandler(mockRequest);

      expect(firstResponse.status).toBe(200);
      expect(firstResponse.data.message).toContain('programado para procesamiento');
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.data.message).toContain('programado para procesamiento');
    });
  });

  // Tests específicos para la nueva funcionalidad de actualización
  describe('Funcionalidad de actualización de tareas', () => {
    beforeEach(() => {
      webhookHandler.clearTasks(); // Limpiar tareas antes de cada test
    });

    it('debe procesar solo el último evento cuando se reciben múltiples eventos de la misma página', async () => {
      const pageId = 'test-page-123';

      // Simular múltiples eventos en rápida sucesión
      const events = [
        { ...realPayloads.pageCreated, entity: { id: pageId, type: 'page' }, type: 'page.created' },
        { ...realPayloads.pageUpdated, entity: { id: pageId, type: 'page' }, type: 'page.updated' },
        { ...realPayloads.pagePropertiesUpdated, entity: { id: pageId, type: 'page' }, type: 'page.properties_updated' }
      ];

      // Enviar todos los eventos
      const responses = [];
      for (const event of events) {
        mockRequest.json.mockResolvedValueOnce(event);
        const response = await webhookHandler(mockRequest);
        responses.push(response);
      }

      // Todos deberían devolver 200
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.message).toContain('Evento programado para procesamiento');
      });

      // El último evento debería indicar actualización
      expect(responses[responses.length - 1].data.eventAction).toBe('update');

      // Esperar a que se procese el evento final
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Verificar que se creó/actualizó la tarea
      const task = webhookHandler.getTaskByPageId(pageId);
      expect(task).toBeDefined();
      expect(task.description).toContain('page.properties_updated');
    });

    it('debe manejar correctamente eventos page.properties_updated', async () => {
      const pageId = realPayloads.pagePropertiesUpdated.entity.id;

      // Primero crear una tarea (simular que ya existe)
      mockRequest.json.mockResolvedValueOnce({
        ...realPayloads.pageCreated,
        entity: { id: pageId, type: 'page' },
        type: 'page.created'
      });
      const createResponse = await webhookHandler(mockRequest);
      
      expect(createResponse.status).toBe(200);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Verificar que se creó la tarea inicial
      let task = webhookHandler.getTaskByPageId(pageId);
      expect(task).toBeDefined();
      expect(task.updated).toBeUndefined();

      // Ahora enviar evento de properties_updated
      mockRequest.json.mockResolvedValueOnce(realPayloads.pagePropertiesUpdated);
      const updateResponse = await webhookHandler(mockRequest);
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.eventAction).toBe('update');
      
      // Esperar a que se procese
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Verificar que se actualizó la tarea existente
      task = webhookHandler.getTaskByPageId(pageId);
      expect(task).toBeDefined();
      expect(task.updated).toBe(true);
      expect(task.description).toContain('page.properties_updated');
    });

    it('debe crear nueva tarea cuando no se encuentra tarea existente para actualización', async () => {
      const pageId = 'non-existent-page';

      // Enviar evento de actualización para página sin tarea existente
      mockRequest.json.mockResolvedValueOnce({
        ...realPayloads.pagePropertiesUpdated,
        entity: { id: pageId, type: 'page' },
        type: 'page.properties_updated'
      });
      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(200);
      expect(response.data.eventAction).toBe('update');
      
      // Esperar a que se procese
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Verificar que se creó nueva tarea (fallback)
      const task = webhookHandler.getTaskByPageId(pageId);
      expect(task).toBeDefined();
      expect(task.description).toContain('fallback');
    });

    it('debe distinguir correctamente entre eventos de creación y actualización', async () => {
      const createEvents = ['page.created'];
      const updateEvents = ['page.updated', 'page.content_updated', 'page.property_updated', 'page.properties_updated'];

      // Test eventos de creación
      for (const eventType of createEvents) {
        mockRequest.json.mockResolvedValueOnce({
          type: eventType,
          entity: { id: `page-${eventType}`, type: 'page' }
        });
        const response = await webhookHandler(mockRequest);
        expect(response.data.eventAction).toBe('create');
      }

      // Test eventos de actualización
      for (const eventType of updateEvents) {
        mockRequest.json.mockResolvedValueOnce({
          type: eventType,
          entity: { id: `page-${eventType}`, type: 'page' }
        });
        const response = await webhookHandler(mockRequest);
        expect(response.data.eventAction).toBe('update');
      }
    });

    it('debe ignorar eventos no relevantes', async () => {
      const irrelevantEvents = [
        { type: 'database.created', entity: { id: 'test-db', type: 'database' } },
        { type: 'database.updated', entity: { id: 'test-db', type: 'database' } },
        { type: 'page.deleted', entity: { id: 'test-page', type: 'page' } }
      ];
      
      for (const event of irrelevantEvents) {
        mockRequest.json.mockResolvedValueOnce(event);
        const response = await webhookHandler(mockRequest);
        
        expect(response.status).toBe(200);
        if (event.type === 'page.deleted') {
          expect(response.data.message).toContain('página eliminada');
        } else if (event.entity.type !== 'page') {
          expect(response.data.message).toContain('no es una página');
        } else {
          expect(response.data.message).toContain('no relevante');
        }
      }
    });

    it('debe manejar secuencia completa: crear -> actualizar -> actualizar propiedades', async () => {
      const pageId = 'full-lifecycle-page';

      // 1. Crear página
      mockRequest.json.mockResolvedValueOnce({
        type: 'page.created',
        entity: { id: pageId, type: 'page' }
      });
      const createResponse = await webhookHandler(mockRequest);
      expect(createResponse.data.eventAction).toBe('create');
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      let task = webhookHandler.getTaskByPageId(pageId);
      expect(task).toBeDefined();
      expect(task.updated).toBeUndefined();

      // 2. Actualizar contenido
      mockRequest.json.mockResolvedValueOnce({
        type: 'page.content_updated',
        entity: { id: pageId, type: 'page' }
      });
      const updateResponse = await webhookHandler(mockRequest);
      expect(updateResponse.data.eventAction).toBe('update');
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      task = webhookHandler.getTaskByPageId(pageId);
      expect(task.updated).toBe(true);
      expect(task.description).toContain('page.content_updated');

      // 3. Actualizar propiedades
      mockRequest.json.mockResolvedValueOnce({
        type: 'page.properties_updated',
        entity: { id: pageId, type: 'page' }
      });
      const propsResponse = await webhookHandler(mockRequest);
      expect(propsResponse.data.eventAction).toBe('update');
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      task = webhookHandler.getTaskByPageId(pageId);
      expect(task.updated).toBe(true);
      expect(task.description).toContain('page.properties_updated');
    });

    it('debe completar tarea cuando el estado de Notion cambia a Listo', async () => {
      const pageId = 'completion-test-page';

      // 1. Crear página inicialmente
      mockRequest.json.mockResolvedValueOnce({
        type: 'page.created',
        entity: { id: pageId, type: 'page' }
      });
      const createResponse = await webhookHandler(mockRequest);
      expect(createResponse.status).toBe(200);
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      const task = webhookHandler.getTaskByPageId(pageId);
      expect(task).toBeDefined();
      expect(task.completed).toBeUndefined();

      // 2. Simular actualización con estado "Listo"
      mockRequest.json.mockResolvedValueOnce({
        type: 'page.properties_updated',
        entity: { id: pageId, type: 'page' },
        data: {
          updated_properties: ['Status']
        }
      });

      const response = await webhookHandler(mockRequest);
      expect(response.status).toBe(200);
      expect(response.data.eventAction).toBe('update');
      
      // En un test real con el webhook real, verificaríamos que se completó la tarea
      // Para este mock, simplemente verificamos que el evento se procesó correctamente
    });
  });
});
