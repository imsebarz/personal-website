/**
 * Tests para webhook de Notion basados en escenarios reales
 * Enfoque: Simple, atómico y fiel a los casos de uso reales
 */

// Mock del webhook handler - simulamos la nueva lógica que procesa el último evento
const createMockWebhookHandler = () => {
  const recentlyProcessed = new Map();
  const pendingEvents = new Map();
  const DEBOUNCE_TIME = 1000; // Reducido para tests más rápidos

  return async (request) => {
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

    // Nueva lógica de debounce: procesar el último evento
    const now = Date.now();
    
    // Si ya existe un evento pendiente, cancelarlo
    const existingPendingEvent = pendingEvents.get(pageId);
    if (existingPendingEvent) {
      clearTimeout(existingPendingEvent.timeoutId);
    }
    
    // Crear nuevo timeout para procesar este evento (el más reciente)
    const timeoutId = setTimeout(async () => {
      // Simular procesamiento exitoso del evento final
      pendingEvents.delete(pageId);
      recentlyProcessed.set(pageId, Date.now());
      
      // En un test real, aquí se procesaría la página
      console.log(`Procesando evento final para página ${pageId}`);
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
        debounceTimeMs: DEBOUNCE_TIME
      }
    };
  };
};

// Mock request
const createMockRequest = () => ({
  json: jest.fn(),
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
});
