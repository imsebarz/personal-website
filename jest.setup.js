// Jest setup file
// Configuración global para tests

// Mock de variables de entorno para tests
process.env.NOTION_USER_ID = 'test-user-id';
process.env.TODOIST_PROJECT_ID = 'test-project-id';
process.env.ENABLE_AI_ENHANCEMENT = 'true';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock global de console para tests más limpios
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};
