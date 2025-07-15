import { NotionWebhookPayload } from '@/types/notion-todoist';

interface WebhookResponse {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export interface NotionTestPayload extends NotionWebhookPayload {
  _testMetadata?: {
    scenario: string;
    description: string;
    expectedOutcome: 'success' | 'skip' | 'error';
    expectedSkipReason?: string;
  };
}

export interface TestScenario {
  name: string;
  description: string;
  payload: NotionTestPayload;
  headers: Record<string, string>;
  expectedOutcome: 'success' | 'skip' | 'error';
  expectedSkipReason?: string;
}

export class NotionWebhookTester {

  // Escenarios de prueba basados únicamente en logs reales de Notion
  getTestScenarios(): TestScenario[] {
    return [
      // 1. Verificación inicial de Notion (necesario para configurar webhook)
      {
        name: 'notion_verification',
        description: 'Verificación inicial del webhook por parte de Notion',
        payload: {
          verification_token: 'test_verification_token_12345',
          _testMetadata: {
            scenario: 'verification',
            description: 'Notion verifica que el endpoint está activo',
            expectedOutcome: 'success'
          }
        } as NotionTestPayload,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'notion-api',
          'x-notion-signature': 'sha256=test_signature_verification'
        },
        expectedOutcome: 'success'
      },

      // 2. page.deleted (logs reales: múltiples eventos de eliminación)
      {
        name: 'page_deleted_real',
        description: 'Página eliminada (formato exacto de logs reales)',
        payload: {
          id: '85b9474b-c8fb-4192-9590-d4defa1c1875',
          timestamp: '2025-07-15T18:54:50.447Z',
          workspace_id: 'bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1',
          workspace_name: 'Corabella Pets',
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
            id: '2311ad4d-650d-8052-be1e-e6a54a97bc3d',
            type: 'page'
          },
          type: 'page.deleted',
          data: {
            parent: {
              id: '1f61ad4d-650d-80e0-b231-d9b12ffea832',
              type: 'database'
            }
          },
          _testMetadata: {
            scenario: 'page_deleted_real',
            description: 'Página eliminada - debe ser ignorada',
            expectedOutcome: 'skip',
            expectedSkipReason: 'página eliminada'
          }
        } as NotionTestPayload,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'notion-api',
          'x-notion-signature': 'sha256=ec1b9e2e91e8751243148686f79fb898c6baa0e71eaa15401002ea56b4437bbe'
        },
        expectedOutcome: 'skip',
        expectedSkipReason: 'eliminada'
      },

      // 3. page.created (logs reales: evento de creación exitoso)
      {
        name: 'page_created_real',
        description: 'Página creada (formato exacto de logs reales)',
        payload: {
          id: 'f78b2acc-a0b1-45a9-9e86-0abd9267ba48',
          timestamp: '2025-07-15T19:41:52.641Z',
          workspace_id: 'bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1',
          workspace_name: 'Corabella Pets',
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
            id: '9999ad4d-650d-8070-9f8e-ef211ff1test', // Page ID ficticio para test de skip
            type: 'page'
          },
          type: 'page.created',
          data: {
            parent: {
              id: '1f61ad4d-650d-80e0-b231-d9b12ffea832',
              type: 'database'
            }
          },
          _testMetadata: {
            scenario: 'page_created_real',
            description: 'Página creada - usuario no mencionado (test)',
            expectedOutcome: 'skip',
            expectedSkipReason: 'usuario no mencionado'
          }
        } as NotionTestPayload,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'notion-api',
          'x-notion-signature': 'sha256=edb15aa1c88d42e6e3adb505635e1ffca457717687fca64e7b4672d42d181683'
        },
        expectedOutcome: 'skip',
        expectedSkipReason: 'usuario no mencionado'
      },

      // 4. page.content_updated (logs reales: evento de actualización exitoso) 
      {
        name: 'page_content_updated_real',
        description: 'Contenido actualizado (formato exacto de logs reales)',
        payload: {
          id: 'd31b4cbf-7858-40fd-a7b3-67f4b24a6c65',
          timestamp: '2025-07-15T19:41:53.572Z',
          workspace_id: 'bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1',
          workspace_name: 'Corabella Pets',
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
            id: '8888ad4d-650d-8070-9f8e-ef211ff1test', // Page ID ficticio para test de skip
            type: 'page'
          },
          type: 'page.content_updated',
          data: {
            parent: {
              id: '1f61ad4d-650d-80e0-b231-d9b12ffea832',
              type: 'database'
            },
            updated_blocks: [
              {
                id: '2311ad4d-650d-80d1-879e-e3009927d8c9',
                type: 'block'
              }
            ]
          },
          _testMetadata: {
            scenario: 'page_content_updated_real',
            description: 'Contenido actualizado - usuario no mencionado (test)',
            expectedOutcome: 'skip',
            expectedSkipReason: 'usuario no mencionado' // Cambió de 'procesado recientemente' 
          }
        } as NotionTestPayload,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'notion-api',
          'x-notion-signature': 'sha256=0a91a99b80defde019db92af628c8ba360e8377d540cacec373136738363efcc'
        },
        expectedOutcome: 'skip',
        expectedSkipReason: 'usuario no mencionado'
      },

      // 5. Request con user-agent inválido (para verificar validación)
      {
        name: 'invalid_user_agent',
        description: 'Request con user-agent no válido',
        payload: {
          type: 'page.created',
          workspace_name: 'Test Workspace',
          entity: {
            id: 'page-invalid-test',
            type: 'page'
          },
          _testMetadata: {
            scenario: 'invalid_source',
            description: 'Request que no proviene de Notion',
            expectedOutcome: 'error'
          }
        } as NotionTestPayload,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'MaliciousBot/1.0', // User-agent incorrecto
        },
        expectedOutcome: 'error'
      }
    ];
  }

  // Crear payload personalizado para testing específico (solo formato real de Notion)
  createCustomPayload(
    type: string, 
    pageId: string, 
    options: {
      workspaceName?: string;
      scenario?: string;
      description?: string;
      expectedOutcome?: 'success' | 'skip' | 'error';
    } = {}
  ): { payload: NotionTestPayload; headers: Record<string, string> } {
    
    const payload: NotionTestPayload = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      workspace_id: 'bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1',
      workspace_name: options.workspaceName || 'Test Workspace',
      subscription_id: '231d872b-594c-8122-963e-0099eb119522',
      integration_id: '230d872b-594c-8060-8665-0037427fe4f8',
      authors: [
        {
          id: '79d3b102-9821-4d8e-bf2b-1e94a65d5120',
          type: 'person'
        }
      ],
      attempt_number: 1,
      type,
      entity: {
        id: pageId,
        type: 'page'
      },
      data: {
        parent: {
          id: '1f61ad4d-650d-80e0-b231-d9b12ffea832',
          type: 'database'
        }
      },
      _testMetadata: {
        scenario: options.scenario || 'custom_test',
        description: options.description || 'Test personalizado',
        expectedOutcome: options.expectedOutcome || 'success'
      }
    };

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'user-agent': 'notion-api',
      'x-notion-signature': `sha256=test_signature_custom_${Date.now()}`
    };

    return { payload, headers };
  }

  // Validar resultado de test
  validateTestResult(
    scenario: TestScenario,
    actualResponse: { status: number; body: WebhookResponse },
    actualProcessingTime: number
  ): {
    passed: boolean;
    errors: string[];
    warnings: string[];
    actualOutcome: 'success' | 'skip' | 'error';
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let actualOutcome: 'success' | 'skip' | 'error' = 'error';

    // Determinar el resultado actual basado en el status code
    if (actualResponse.status === 200) {
      if (actualResponse.body?.success === false) {
        actualOutcome = 'error';
      } else if (typeof actualResponse.body?.message === 'string' &&
                 (actualResponse.body.message.includes('ignorado') || 
                  actualResponse.body.message.includes('skip') ||
                  actualResponse.body.message.includes('Usuario no mencionado') ||
                  actualResponse.body.message.includes('procesado recientemente'))) {
        actualOutcome = 'skip';
      } else {
        actualOutcome = 'success';
      }
    } else if (actualResponse.status >= 400) {
      actualOutcome = 'error';
    }

    // Validar outcome esperado
    if (scenario.expectedOutcome !== actualOutcome) {
      errors.push(
        `Outcome esperado: ${scenario.expectedOutcome}, actual: ${actualOutcome}`
      );
    }

    // Validar razón de skip si aplica
    if (scenario.expectedOutcome === 'skip' && scenario.expectedSkipReason) {
      const message = actualResponse.body?.message;
      const skipReasonFound = typeof message === 'string' && 
        message.toLowerCase().includes(scenario.expectedSkipReason.toLowerCase());
      
      if (!skipReasonFound) {
        errors.push(
          `Razón de skip esperada: "${scenario.expectedSkipReason}", no encontrada en: "${message}"`
        );
      }
    }

    // Warnings para performance
    if (actualProcessingTime > 5000) { // Más de 5 segundos
      warnings.push(`Tiempo de procesamiento alto: ${actualProcessingTime}ms`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      actualOutcome
    };
  }
}

// Instancia singleton para usar en tests
export const notionWebhookTester = new NotionWebhookTester();
