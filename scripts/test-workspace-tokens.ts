/**
 * Test script to verify workspace token resolution
 * Run this to test the multi-workspace functionality
 */

// Mock environment variables for testing
process.env.NOTION_TOKEN = 'default_token_12345';
process.env.NOTION_TOKEN_CORABELLA_PETS = 'corabella_pets_token_67890';
process.env.NOTION_TOKEN_TEST_WORKSPACE = 'test_workspace_token_abcde';

// Import the function after setting env vars
import { getNotionPageContent } from '../src/utils/notion-client';

async function testWorkspaceTokenResolution() {
  console.log('🧪 Testing Workspace Token Resolution\n');
  
  // Test workspace name to environment variable conversion
  const testCases = [
    { workspace: 'Corabella Pets', expectedEnvVar: 'NOTION_TOKEN_CORABELLA_PETS' },
    { workspace: 'Test Workspace', expectedEnvVar: 'NOTION_TOKEN_TEST_WORKSPACE' },
    { workspace: 'My-Company Name', expectedEnvVar: 'NOTION_TOKEN_MY_COMPANY_NAME' },
    { workspace: undefined, expectedEnvVar: 'NOTION_TOKEN' },
  ];
  
  for (const testCase of testCases) {
    console.log(`📝 Testing workspace: "${testCase.workspace || 'undefined'}"`);
    console.log(`   Expected env var: ${testCase.expectedEnvVar}`);
    
    try {
      // This will show in logs which token is being used
      // Note: This will fail since we don't have a real page ID, but it will show the token selection logic
      await getNotionPageContent('test-page-id', testCase.workspace);
    } catch (error) {
      // Expected to fail, but we'll see the logs
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`   ✅ Token selection logged (error expected: ${errorMessage.substring(0, 50)}...)`);
    }
    console.log('');
  }
  
  console.log('🎉 Test completed! Check the logs above to see which tokens were selected.');
}

// Only run if this file is executed directly
if (require.main === module) {
  testWorkspaceTokenResolution().catch(console.error);
}

export { testWorkspaceTokenResolution };
