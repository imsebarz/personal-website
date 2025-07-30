# AI Agent Instructions for Sebastian Ruiz Personal Website

## 🎯 Project Overview

Modern portfolio website with **Next.js 15**, **React 19**, **TypeScript**, and **SCSS**. Features a **Notion-Todoist integration system** with webhook automation.

**Live Site**: [imsebarz.vercel.app](https://imsebarz.vercel.app)

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Runtime**: React 19 (TypeScript strict mode)
- **Styling**: SCSS with CSS custom properties
- **Animations**: Framer Motion + react-intersection-observer
- **Deployment**: Vercel
- **Testing**: Jest with TypeScript
- **Key Dependencies**: `@notionhq/client`, `openai`, `framer-motion`, `sass`

## 🏗️ Core Principles

- **Service-Oriented**: Clear separation in `src/services/`
- **Type Safety**: Comprehensive TypeScript interfaces
- **Test-Driven**: TDD approach with 80%+ coverage
- **Performance**: Optimized for Vercel serverless
- **Native Node.js**: Prefer built-in APIs over dependencies

## 📁 Project Structure Deep Dive

```
src/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Homepage component
│   └── api/                     # API routes (serverless functions)
│       ├── notion-webhook/      # Notion webhook handler
│       └── todoist-webhook/     # Todoist webhook handler
│
├── components/                   # React components
│   ├── common/                  # Reusable components
│   │   └── Icon.tsx            # SVG icon wrapper
│   ├── Hero.tsx                # Landing section
│   ├── AboutMe.tsx             # About section
│   ├── FeaturedProjects.tsx    # Featured project showcase
│   ├── FeaturedProject.tsx     # Individual featured project
│   ├── MyWork.tsx              # All projects grid
│   ├── Project.tsx             # Individual project card
│   ├── Contact.tsx             # Contact form section
│   ├── Nav.tsx                 # Navigation component
│   └── Footer.tsx              # Site footer
│
├── config/                      # Configuration files
│   └── constants.ts            # App-wide constants
│
├── data/                        # Static JSON data
│   ├── aboutme.json           # Personal information
│   ├── contact.json           # Contact information
│   ├── nav.json               # Navigation links
│   └── projects.json          # Project portfolio data
│
├── hooks/                       # Custom React hooks
│   └── useData.ts             # Data fetching hook
│
├── lib/                         # Core utilities and configuration
│   ├── animation.ts           # Framer Motion variants
│   ├── api-response.ts        # API response helpers
│   ├── config.ts              # Environment configuration
│   ├── helpers.ts             # General utility functions
│   ├── logger.ts              # Centralized logging
│   └── index.ts               # Library exports
│
├── middleware/                  # Express-style middleware
│   └── error-handler.ts       # Global error handling
│
├── services/                    # Business logic services
│   ├── health-check.service.ts           # Health monitoring
│   ├── index.ts                          # Service exports
│   └── webhooks/                         # Webhook-specific services
│       ├── notion-todoist.service.ts     # Core integration logic
│       ├── notion-webhook.service.ts     # Notion webhook processing
│       └── todoist-webhook.service.ts    # Todoist webhook processing
│
├── styles/                      # SCSS stylesheets
│   ├── globals.scss           # Global styles and CSS variables
│   ├── colors.scss            # Color palette definitions
│   ├── mixins.scss            # SCSS mixins and functions
│   └── [component].scss       # Component-specific styles
│
├── types/                       # TypeScript definitions
│   ├── index.ts               # Common types (Project, PersonalInfo, etc.)
│   ├── notion-todoist.ts      # Integration-specific types
│   └── assets.d.ts            # Asset type declarations
│
└── utils/                       # Utility functions
    ├── notion-client.ts       # Notion API wrapper
    ├── todoist-client.ts      # Todoist API wrapper
    ├── openai-client.ts       # OpenAI integration
    ├── webhook-logger.ts      # Webhook-specific logging
    ├── tag-helpers.ts         # Tag manipulation utilities
    ├── notion-webhook-validator.ts    # Notion webhook validation
    └── todoist-webhook-validator.ts   # Todoist webhook validation
```

## 🔗 Notion-Todoist Integration System

### Architecture Overview
The integration system automatically synchronizes Notion pages with Todoist tasks, supporting multiple workspaces and AI-enhanced task management with three main flows:

1. **Notion → Todoist**: Creates/updates tasks when pages are mentioned or modified
2. **Todoist → Notion**: Updates page status when tasks are completed/uncompleted  
3. **Multi-workspace support**: Automatic workspace detection with dynamic project creation

### Key Integration Patterns

#### Webhook Processing Architecture
```typescript
// All webhooks follow this debounced processing pattern
const recentlyProcessed = new Map<string, number>();
const pendingEvents = new Map<string, { payload: any; timeoutId: NodeJS.Timeout }>();

// Process only the LATEST event after debounce period
setTimeout(() => {
  // Process the final event for this pageId
}, config.webhooks.debounceTime);
```

#### Multi-Workspace Token Resolution
Environment variables follow the pattern: `NOTION_TOKEN_[WORKSPACE_NAME_UPPERCASE]`
```typescript
// Example: workspace "Corabella Pets" → NOTION_TOKEN_CORABELLA_PETS
const token = process.env[`NOTION_TOKEN_${workspaceName.toUpperCase().replace(/\s+/g, '_')}`] 
  || process.env.NOTION_TOKEN; // fallback to default
```

#### Service Layer Pattern
All business logic lives in `src/services/` with clear separation:
- `NotionWebhookService`: Handles webhook validation, debouncing, mention detection
- `NotionTodoistService`: Core integration logic (create/update/delete tasks)
- `TodoistWebhookService`: Processes task completion events back to Notion

### Environment Variables Pattern
```env
# Default Notion Configuration
NOTION_TOKEN=your_default_token
NOTION_VERIFICATION_TOKEN=your_verification_token
NOTION_USER_ID=your_user_id
NOTION_WEBHOOK_SECRET=your_webhook_secret

# Multi-Workspace Support (Format: NOTION_TOKEN_[WORKSPACE_NAME_UPPERCASE])
NOTION_TOKEN_PERSONAL=your_personal_workspace_token
NOTION_TOKEN_CORABELLA_PETS=your_company_workspace_token

# Todoist Configuration
TODOIST_API_TOKEN=your_todoist_api_token
TODOIST_PROJECT_ID=fallback_project_id  # Optional fallback
TODOIST_WEBHOOK_SECRET=your_todoist_webhook_secret
TODOIST_CLIENT_ID=your_client_id
TODOIST_CLIENT_SECRET=your_client_secret

# OpenAI Enhancement (Optional)
OPENAI_API_KEY=your_openai_api_key
ENABLE_AI_ENHANCEMENT=true
```

### Integration Points & Data Flow

#### Notion Webhook Events
- `page.content_updated`, `page.properties_updated` → Update existing task
- `page.created` → Create new task  
- User mention removal → Delete task

#### Workspace Detection Flow
1. Extract `workspace_name` from webhook payload
2. Resolve token: `NOTION_TOKEN_${workspaceName}` or fallback
3. Create/find Todoist project matching workspace name
4. Tag task with `workspace:${workspaceName.toLowerCase()}`

#### Task State Synchronization
Completed statuses: `['Listo', 'Done', 'Completed', 'Completado', 'Terminado', 'Finished']`
- Notion page status change → Complete Todoist task
- Todoist task completion → Update Notion page status

### Project-Specific Conventions

#### Task Description Format
Tasks always include Notion page URL for bidirectional sync:
```typescript
description: `${content}\n\nNotion: ${url}`;
```

#### Workspace Tagging
Every task gets a workspace tag: `workspace:workspacename` (lowercase)

#### AI Enhancement
Optional OpenAI integration enhances task descriptions while preserving original titles:
```typescript
finalContent = {
  ...pageContent,
  title: pageContent.title, // Keep original title
  content: aiEnhancement.enhancedDescription,
  // ... other AI suggestions
};
```

## 🎨 Styling Architecture

### SCSS Organization
- **colors.scss**: Centralized color palette using CSS custom properties
- **mixins.scss**: Reusable SCSS mixins for common patterns
- **globals.scss**: Global styles, typography, and layout utilities
- **Component styles**: Each component has its own SCSS file with BEM methodology

### Design System
```scss
:root {
  // Color Palette
  --color-green: #04a175;      // Primary brand color
  --color-mint: #f0fdf9;       // Light accent
  --color-black: #1a1a1a;     // Text primary
  --color-pepper: #666666;     // Text secondary
  
  // Typography
  --font-recoleta: 'Recoleta', 'Roboto', sans-serif;  // Display font
  --font-roboto: 'Roboto', sans-serif;                // Body font
  
  // Spacing System
  --spacing-xs: 0.5em;
  --spacing-sm: 1em;
  --spacing-md: 2em;
  --spacing-lg: 3em;
  --spacing-xl: 4em;
  --spacing-xxl: 6em;
  
  // Transitions
  --transition-fast: all 0.2s ease;
  --transition-normal: all 0.3s ease;
  --transition-slow: all 0.5s ease;
}
```

### Responsive Breakpoints
- **Mobile**: < 600px
- **Tablet**: 600px - 900px  
- **Desktop**: > 900px

## 🧪 Testing Architecture & TDD

### Test Structure
```
__tests__/                       # Unit tests
├── notion-todoist-service.test.ts    # Service layer tests
├── todoist-webhook-service.test.ts   # Webhook processing tests
└── webhook-service.test.ts           # Integration tests

scripts/                         # Test utilities and scripts
├── test-webhook.js             # Webhook testing utilities
├── test-dynamic-projects.js    # Project creation testing
└── test-mention-removal.js     # Mention removal testing
```

### Testing Configuration
```javascript
// jest.config.js
{
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',  // Path mapping
  },
  extensionsToTreatAsEsm: ['.jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }]
  },
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true
}
```

### Test-Driven Development (TDD) Approach
This project follows TDD principles: Red (write failing test) → Green (make it pass) → Refactor.

#### TDD Guidelines for New Features
```typescript
// Always start with test
describe('NewService', () => {
  beforeEach(() => {
    mockNotionClient = jest.fn()
    mockTodoistClient = jest.fn()
    service = new NewService(mockConfig)
  })

  it('should handle error gracefully when API fails', async () => {
    mockNotionClient.mockRejectedValue(new Error('API Error'))
    await expect(service.processData(input)).rejects.toThrow('API Error')
    expect(logger.error).toHaveBeenCalledWith('Service error', expect.any(Object))
  })
})

// Mock external dependencies consistently
jest.mock('@/utils/notion-client', () => ({
  getNotionPageContent: jest.fn(),
  isUserMentioned: jest.fn(),
}));
```

## 🚀 Development Guidelines

### Critical Development Workflows

#### Testing Webhook Integration
```bash
# Use dedicated test scripts (not generic testing)
npm run test:webhook          # Test webhook functionality
npm run test:webhook:real     # Test with real APIs
npm run test:projects         # Test project creation
npm run test:projects:cleanup # Cleanup test projects
```

#### Error Handling Pattern
All API routes use `withErrorHandler` middleware:
```typescript
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Business logic here
  return createSuccessResponse(result);
});
```

### Adding New Features

#### 1. **New Components**
```typescript
// src/components/NewComponent.tsx
'use client'

import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ContainerVariants } from '@/lib/animation'
import '@/styles/new-component.scss'

interface NewComponentProps {
  // Define props with TypeScript interfaces
}

const NewComponent: React.FC<NewComponentProps> = ({ ...props }) => {
  const [ref, inView] = useInView()
  const animation = useAnimation()

  useEffect(() => {
    if (inView) {
      animation.start('visible')
    } else {
      animation.start('hidden')
    }
  }, [inView, animation])

  return (
    <motion.div
      ref={ref}
      variants={ContainerVariants}
      initial="hidden"
      animate={animation}
      className="new-component"
    >
      {/* Component content */}
    </motion.div>
  )
}

export default NewComponent
```

#### 2. **New Services**
```typescript
// src/services/new-service.ts
import { logger } from '@/lib/logger'
import { config } from '@/lib/config'

export class NewService {
  constructor(private readonly config: ServiceConfig) {}
  
  async processData(input: InputType): Promise<OutputType> {
    try {
      logger.info('Processing data', { input })
      // Service logic here
      return result
    } catch (error) {
      logger.error('Service error', { error, input })
      throw error
    }
  }
}
```

### Code Style Guidelines

#### Native Node.js First (Vercel-Optimized)
- **Prefer Native APIs**: Always use native Node.js APIs when possible over external dependencies
- **Serverless Optimization**: Minimize bundle size and cold start time for Vercel functions
- **Latest Node APIs**: Use the most recent stable Node.js APIs (Node 18+ features)
- **Built-in Modules**: Prioritize `fetch()`, `crypto`, `url`, `querystring`, `buffer` over external packages
- **Examples**: 
  - Use native `fetch()` instead of `axios` when possible
  - Use `crypto.createHmac()` for webhook validation instead of external crypto libs
  - Use `URL` constructor for URL parsing instead of external parsers
  - Use `Buffer` for encoding/decoding instead of external utilities

#### TypeScript Usage
- **Strict Mode**: Always use strict TypeScript settings
- **Interfaces**: Define interfaces for all props and data structures
- **Type Guards**: Use type guards for runtime type checking
- **Utility Types**: Leverage TypeScript utility types (Partial, Pick, etc.)

#### Component Patterns
- **Functional Components**: Use React functional components exclusively
- **Custom Hooks**: Extract complex logic to custom hooks
- **Props Drilling**: Avoid deep props drilling; use context when needed
- **Memoization**: Use React.memo for performance optimization when needed

#### Error Handling
- **Try-Catch**: Wrap async operations in try-catch blocks
- **Logging**: Use centralized logger for all error reporting
- **User Feedback**: Provide meaningful error messages
- **Graceful Degradation**: Handle failures gracefully

#### Test-First Development
- **Write Tests First**: Always write tests before implementation (TDD)
- **Test Coverage**: Minimum 80% coverage for new features
- **Mock External Dependencies**: Use Jest mocks for API calls and external services
- **Test Edge Cases**: Include tests for error scenarios and boundary conditions
- **Regression Testing**: Add tests for bug fixes to prevent regressions

#### Documentation Policy
- **No Feature Documentation**: Never create documentation for new features or functionalities
- **Code Self-Documentation**: Write self-documenting code with clear variable/function names
- **TypeScript Types**: Rely on TypeScript interfaces and types for API contracts
- **Comments**: Only add comments for complex business logic, not feature explanations

## 🚨 Important Constraints & Considerations

### Serverless Environment (Vercel)
- **Timeout Limits**: API routes have 30-second maximum execution time
- **Memory Constraints**: Optimize for memory usage in webhook processing
- **Cold Starts**: Minimize initialization overhead and bundle size in API routes
- **Stateless**: All services must be stateless between requests
- **Native Node.js Priority**: Use built-in Node.js modules to reduce bundle size and improve cold start performance
- **Latest Runtime**: Target Node.js 18+ features and APIs for optimal Vercel performance

### External API Rate Limits
- **Notion API**: Respect rate limits with proper error handling
- **Todoist API**: Implement exponential backoff for retries
- **OpenAI API**: Handle quota limits gracefully, fail silently

### Security Considerations
- **Webhook Validation**: Always validate webhook signatures
- **Environment Variables**: Never expose secrets in client-side code
- **CORS**: Configure proper CORS settings for API routes
- **Input Validation**: Validate all external inputs

## 🧰 Available Scripts

```bash
# Development
npm run dev                    # Start development server
npm run type-check            # TypeScript type checking
npm run type-check:watch      # Watch mode type checking

# Building & Deployment
npm run build                 # Build for production
npm run start                 # Start production server
npm run preview               # Build and preview locally

# Code Quality
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint issues

# Testing
npm run test                  # Run Jest tests
npm run test:watch            # Watch mode testing
npm run test:coverage         # Generate coverage report

# Webhook Testing
npm run test:webhook          # Test webhook functionality
npm run test:webhook:real     # Test with real APIs
npm run test:projects         # Test project creation
npm run test:projects:cleanup # Cleanup test projects
```

## 📁 Critical Files to Understand

- `src/services/webhooks/notion-webhook.service.ts` - Debouncing & validation logic
- `src/services/webhooks/notion-todoist.service.ts` - Core integration business logic  
- `src/utils/notion-client.ts` - Multi-workspace token resolution
- `src/utils/todoist-client.ts` - Dynamic project creation
- `scripts/test-*.js` - Integration testing utilities

## 🎯 Key Success Metrics

When working with this codebase, ensure:

1. **Type Safety**: All new code must be fully typed with TypeScript
2. **Test Coverage**: Minimum 80% test coverage for new features, 100% for critical paths
3. **TDD Compliance**: All new features developed using Test-Driven Development
4. **Performance**: Maintain Lighthouse scores (>90 for Performance, Accessibility, SEO)
5. **Responsive Design**: Test on all breakpoint ranges
6. **Animation Smoothness**: Ensure 60fps animations on supported devices
7. **Webhook Reliability**: Integration tests must pass consistently
8. **Error Handling**: All error paths must be tested and logged
9. **Accessibility**: Maintain WCAG 2.1 AA compliance
10. **Test Quality**: Tests must be readable, maintainable, and provide meaningful assertions

## 🚨 Development Anti-Patterns to Avoid

❌ Don't hardcode project IDs - use dynamic workspace-based project creation
❌ Don't process every webhook event - implement proper debouncing  
❌ Don't expose webhook secrets in client-side code
❌ Don't mock individual utilities in tests - mock at the API boundary
❌ Don't modify AI-enhanced titles - preserve original Notion titles
❌ Don't add external dependencies when native Node.js APIs are sufficient
❌ Don't create documentation files for new features - let code be self-documenting
❌ Don't use outdated APIs when newer Node.js built-ins are available

## 📧 Getting Help

- **GitHub Issues**: [Create an issue](https://github.com/imsebarz/personal-website/issues)
- **Documentation**: Check the `docs/` directory for specific guides
- **Contact**: imsebarz@gmail.com

---

**Remember**: This codebase prioritizes clean architecture, type safety, performance, and Test-Driven Development. When in doubt, follow the existing patterns and maintain consistency with the established code style. Always write tests first, especially for webhook integrations where reliability is critical.
