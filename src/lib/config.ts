/**
 * Configuración centralizada de la aplicación
 */

export const config = {
  // Notion configuration
  notion: {
    userId: process.env.NOTION_USER_ID,
    webhookSecret: process.env.NOTION_WEBHOOK_SECRET,
  },
  
  // Todoist configuration
  todoist: {
    apiToken: process.env.TODOIST_API_TOKEN,
    projectId: process.env.TODOIST_PROJECT_ID,
    baseUrl: 'https://api.todoist.com/rest/v2',
    webhookSecret: process.env.TODOIST_WEBHOOK_SECRET,
    clientId: process.env.TODOIST_CLIENT_ID,
    clientSecret: process.env.TODOIST_CLIENT_SECRET,
  },
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    enabled: process.env.ENABLE_AI_ENHANCEMENT === 'true',
  },
  
  // Webhook configuration
  webhooks: {
    debounceTime: 60000, // 60 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Type-safe environment validation
export function validateEnvironment() {
  const required = {
    TODOIST_API_TOKEN: config.todoist.apiToken,
  };
  
  const optional = {
    NOTION_USER_ID: config.notion.userId,
    TODOIST_PROJECT_ID: config.todoist.projectId,
    OPENAI_API_KEY: config.openai.apiKey,
  };
  
  // Check required variables
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  // Log optional variables status
  if (config.isDevelopment) {
    console.log('🔧 Configuration status:');
    for (const [key, value] of Object.entries(optional)) {
      console.log(`  ${key}: ${value ? '✅ Set' : '❌ Not set'}`);
    }
  }
}
