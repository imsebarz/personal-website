# Sebastian Ruiz - Personal Portfolio

A modern, responsive portfolio website built with Next.js, TypeScript, and SCSS. Features smooth animations, clean design, and optimized performance.

## 🚀 Features

- **Modern Tech Stack**: Next.js 15, React 19, TypeScript, SCSS
- **Responsive Design**: Mobile-first approach with optimized layouts
- **Smooth Animations**: Framer Motion for engaging user interactions
- **Performance Optimized**: Image optimization, lazy loading, and efficient bundling
- **SEO Friendly**: Meta tags, structured data, and accessibility features
- **Clean Code**: TypeScript interfaces, custom hooks, and reusable components

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: SCSS with CSS custom properties
- **Animations**: Framer Motion
- **Package Manager**: npm
- **Deployment**: Vercel

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── common/            # Reusable components (Icon, etc.)
│   └── ...                # Feature-specific components
├── config/                # App configuration and constants
├── data/                  # JSON data files
├── hooks/                 # Custom React hooks
├── styles/                # SCSS stylesheets
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions and helpers
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/imsebarz/personal-website.git
cd personal-website
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## 🎨 Key Features

### Component Architecture
- **Reusable Components**: Icon component for consistent SVG usage
- **Custom Hooks**: Data fetching hooks for clean component logic
- **TypeScript**: Full type safety throughout the application

### Performance Optimizations
- **Image Optimization**: Next.js Image component with WebP format
- **Code Splitting**: Automatic code splitting with Next.js
- **CSS Variables**: Consistent theming and easier maintenance
- **Animation Performance**: Optimized Framer Motion configurations

### Accessibility
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Focus Management**: Keyboard navigation support
- **Alt Text**: Descriptive alt text for all images
- **ARIA Labels**: Screen reader friendly components

## 🌟 Sections

1. **Hero** - Introduction with animated greeting
2. **About Me** - Personal background and skills
3. **Featured Projects** - Highlighted work with details
4. **My Work** - Project gallery with tags and links
5. **Contact** - Get in touch section
6. **Footer** - Social links and credits

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for environment-specific configurations:

```env
# Add your environment variables here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 🔗 Notion-Todoist Integration

This project includes a powerful integration between Notion and Todoist with the following features:

### ✨ Key Features
- **Dynamic Project Creation**: Automatically creates Todoist projects based on Notion workspace names
- **Webhook Processing**: Handles Notion webhooks for real-time task synchronization
- **AI Enhancement**: Optional OpenAI integration for task content improvement
- **Bidirectional Sync**: Task completion sync between Notion and Todoist
- **Workspace Organization**: Tasks are organized by workspace with automatic tagging

### 🚀 Dynamic Project Creation (New Feature)
Instead of using a hardcoded `TODOIST_PROJECT_ID`, the system now:
1. Detects the workspace name from Notion webhooks
2. Creates/finds projects using the workspace name directly
3. Falls back to default project if creation fails
4. Automatically organizes tasks by workspace

### 📋 Required Environment Variables
```env
# Notion Configuration
NOTION_TOKEN=your_notion_token
NOTION_VERIFICATION_TOKEN=your_verification_token
NOTION_USER_ID=your_user_id

# Todoist Configuration  
TODOIST_API_TOKEN=your_todoist_api_token
TODOIST_PROJECT_ID=your_fallback_project_id  # Optional: used as fallback

# Optional: OpenAI Enhancement
OPENAI_API_KEY=your_openai_api_key
ENABLE_AI_ENHANCEMENT=true
```

### 📚 Documentation
- [Dynamic Project Creation Guide](./docs/dynamic-project-creation.md)
- [Webhook Configuration](./docs/webhook-vercel-fix.md)

### Customization
- **Colors**: Edit `src/styles/colors.scss`
- **Fonts**: Update font imports in `src/app/layout.tsx`
- **Content**: Modify JSON files in `src/data/`
- **Animations**: Adjust settings in `src/utils/animation.ts`

## 📱 Responsive Design

The website is fully responsive with breakpoints:
- **Mobile**: < 600px
- **Tablet**: 600px - 900px  
- **Desktop**: > 900px

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📧 Contact

- **Email**: imsebarz@gmail.com
- **LinkedIn**: [imsebarz](https://linkedin.com/in/imsebarz)
- **GitHub**: [imsebarz](https://github.com/imsebarz)
- **Portfolio**: [imsebarz.vercel.app](https://imsebarz.vercel.app)

---

Made with 💛 by Sebastian Ruiz
