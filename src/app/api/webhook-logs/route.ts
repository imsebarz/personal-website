import { NextRequest, NextResponse } from 'next/server';
import { webhookLogger } from '@/utils/webhook-logger';
import { notionWebhookTester, TestScenario } from '@/utils/webhook-tester';

// Función auxiliar para crear payloads de load test
function createLoadTestPayloads(count: number) {
  const payloads = [];
  for (let i = 0; i < count; i++) {
    payloads.push({
      payload: {
        id: `load-test-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        workspace_id: 'bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1',
        workspace_name: `Load Test ${i}`,
        subscription_id: '231d872b-594c-8122-963e-0099eb119522',
        integration_id: '230d872b-594c-8060-8665-0037427fe4f8',
        authors: [{ id: '79d3b102-9821-4d8e-bf2b-1e94a65d5120', type: 'person' }],
        attempt_number: 1,
        entity: { id: `load-test-page-${i}`, type: 'page' },
        type: 'page.created',
        data: { parent: { id: '1f61ad4d-650d-80e0-b231-d9b12ffea832', type: 'database' } }
      },
      headers: {
        'content-type': 'application/json',
        'user-agent': 'notion-api',
        'x-notion-signature': `sha256=load_test_${i}`
      }
    });
  }
  return payloads;
}

// Función auxiliar para crear secuencia real
function createRealSequencePayloads() {
  const baseId = '2311ad4d-650d-80d3-ad7e-c656e9da9642';
  return [
    {
      payload: {
        id: 'seq-delete-1',
        timestamp: new Date().toISOString(),
        workspace_id: 'bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1',
        workspace_name: 'Corabella Pets',
        entity: { id: '2311ad4d-650d-8052-be1e-e6a54a97bc3d', type: 'page' },
        type: 'page.deleted'
      },
      headers: { 'content-type': 'application/json', 'user-agent': 'notion-api' }
    },
    {
      payload: {
        id: 'seq-create-1',
        timestamp: new Date().toISOString(),
        workspace_id: 'bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1',
        workspace_name: 'Corabella Pets',
        entity: { id: baseId, type: 'page' },
        type: 'page.created'
      },
      headers: { 'content-type': 'application/json', 'user-agent': 'notion-api' }
    },
    {
      payload: {
        id: 'seq-update-1',
        timestamp: new Date().toISOString(),
        workspace_id: 'bcd7dac8-d5d8-4726-ad5a-f6a0e1ad9ef1',
        workspace_name: 'Corabella Pets',
        entity: { id: baseId, type: 'page' },
        type: 'page.content_updated'
      },
      headers: { 'content-type': 'application/json', 'user-agent': 'notion-api' }
    }
  ];
}

// GET /api/webhook-logs - Ver logs y estadísticas
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'logs';
    const format = searchParams.get('format') || 'json';

    switch (action) {
      case 'logs':
        const logs = webhookLogger.getAllLogs();
        return NextResponse.json({
          logs: logs.slice(0, 50), // Últimos 50 logs
          total: logs.length,
          hasMore: logs.length > 50
        });

      case 'stats':
        const stats = webhookLogger.getStats();
        return NextResponse.json({ stats });

      case 'export':
        const exportedLogs = webhookLogger.exportLogs(format as 'json' | 'csv');
        const contentType = format === 'csv' 
          ? 'text/csv' 
          : 'application/json';
        
        return new NextResponse(exportedLogs, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="webhook-logs.${format}"`
          }
        });

      case 'failed':
        const failedLogs = webhookLogger.getFailedLogs();
        return NextResponse.json({ logs: failedLogs });

      case 'test-scenarios':
        const scenarios = notionWebhookTester.getTestScenarios();
        return NextResponse.json({ 
          scenarios: scenarios.map(s => ({
            name: s.name,
            description: s.description,
            expectedOutcome: s.expectedOutcome,
            expectedSkipReason: s.expectedSkipReason
          }))
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida. Usa: logs, stats, export, failed, test-scenarios' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en webhook-logs GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/webhook-logs - Ejecutar tests
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, scenario, count, hours } = body;

    switch (action) {
      case 'run-test':
        return await runSingleTest(scenario);

      case 'run-all-tests':
        return await runAllTests();

      case 'run-load-test':
        return await runLoadTest(count || 10);

      case 'run-real-sequence':
        return await runRealSequence();

      case 'clear-logs':
        // Permitir horas desde el body del JSON o URL query param
        const hoursToDelete = hours || parseInt(request.url.split('hours=')[1]) || 0.1; // Default 0.1 horas = 6 minutos
        const removed = webhookLogger.clearOldLogs(hoursToDelete);
        return NextResponse.json({ 
          message: `${removed} logs eliminados (más antiguos que ${hoursToDelete}h)`,
          removedCount: removed,
          hoursUsed: hoursToDelete
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida. Usa: run-test, run-all-tests, run-load-test, run-real-sequence, clear-logs' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en webhook-logs POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function runSingleTest(scenarioName: string) {
  const scenarios = notionWebhookTester.getTestScenarios();
  const scenario = scenarios.find(s => s.name === scenarioName);
  
  if (!scenario) {
    return NextResponse.json(
      { error: `Scenario '${scenarioName}' no encontrado` },
      { status: 404 }
    );
  }

  const result = await executeTest(scenario);
  return NextResponse.json({ result });
}

async function runAllTests() {
  const scenarios = notionWebhookTester.getTestScenarios();
  const results = [];

  for (const scenario of scenarios) {
    const result = await executeTest(scenario);
    results.push(result);
    
    // Pequeña pausa entre tests para evitar sobrecarga
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results
  };

  return NextResponse.json({ summary });
}

async function runLoadTest(count: number) {
  if (count > 100) {
    return NextResponse.json(
      { error: 'Máximo 100 requests para load test' },
      { status: 400 }
    );
  }

  const payloads = createLoadTestPayloads(count);
  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < payloads.length; i++) {
    const { payload, headers } = payloads[i];
    
    try {
      const testStartTime = Date.now();
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notion-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });

      // const responseBody = await response.json(); // No se usa, pero se consume la respuesta
      const duration = Date.now() - testStartTime;

      results.push({
        requestNumber: i + 1,
        success: response.ok,
        status: response.status,
        duration,
        pageId: payload.entity?.id
      });

    } catch (error) {
      results.push({
        requestNumber: i + 1,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        pageId: payload.entity?.id
      });
    }

    // Pausa mínima entre requests
    if (i < payloads.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  const totalTime = Date.now() - startTime;
  const successfulRequests = results.filter(r => r.success).length;
  
  return NextResponse.json({
    loadTest: {
      totalRequests: count,
      successfulRequests,
      failedRequests: count - successfulRequests,
      totalTime,
      averageTime: Math.round(totalTime / count),
      requestsPerSecond: Math.round((count / totalTime) * 1000),
      results
    }
  });
}

async function runRealSequence() {
  const payloads = createRealSequencePayloads();
  const results = [];
  const startTime = Date.now();

  console.log('🔄 Ejecutando secuencia real de eventos...');

  for (let i = 0; i < payloads.length; i++) {
    const { payload, headers } = payloads[i];
    
    try {
      const testStartTime = Date.now();
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notion-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });

      const responseBody = await response.json();
      const duration = Date.now() - testStartTime;

      results.push({
        step: i + 1,
        eventType: payload.type,
        pageId: payload.entity?.id,
        success: response.ok,
        status: response.status,
        duration,
        response: responseBody
      });

      console.log(`  Step ${i + 1}: ${payload.type} -> ${response.status} (${duration}ms)`);

      // Pausa entre requests para simular timing real
      if (i < payloads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      results.push({
        step: i + 1,
        eventType: payload.type,
        pageId: payload.entity?.id,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  const totalTime = Date.now() - startTime;
  
  return NextResponse.json({
    realSequence: {
      totalSteps: payloads.length,
      successfulSteps: results.filter(r => r.success).length,
      totalTime,
      results,
      summary: `Secuencia completada: ${results.filter(r => r.success).length}/${payloads.length} pasos exitosos`
    }
  });
}

async function executeTest(scenario: TestScenario) {
  const startTime = Date.now();
  
  try {
    // Simular request al webhook
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notion-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...scenario.headers
      },
      body: JSON.stringify(scenario.payload)
    });

    const responseBody = await response.json();
    const duration = Date.now() - startTime;

    // Validar resultado
    const validation = notionWebhookTester.validateTestResult(
      scenario,
      { status: response.status, body: responseBody },
      duration
    );

    return {
      scenario: scenario.name,
      description: scenario.description,
      passed: validation.passed,
      actualOutcome: validation.actualOutcome,
      expectedOutcome: scenario.expectedOutcome,
      duration,
      response: {
        status: response.status,
        body: responseBody
      },
      validation: {
        errors: validation.errors,
        warnings: validation.warnings
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      scenario: scenario.name,
      description: scenario.description,
      passed: false,
      actualOutcome: 'error' as const,
      expectedOutcome: scenario.expectedOutcome,
      duration,
      error: error instanceof Error ? error.message : 'Error desconocido',
      validation: {
        errors: [`Error ejecutando test: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        warnings: []
      }
    };
  }
}
