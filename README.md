# Orb Companion WebApp

A companion webapp for the Orb billing platform built with Next.js 15 and TypeScript. This application supports multiple Orb instances (Cloud Infrastructure and AI Agents) with instance-specific configurations and branding.

## Prerequisites

Before setting up this application, ensure you have the following installed:

- **Node.js** (version 18.x or higher recommended)
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- Access to Orb billing platform with API keys

## Required Dependencies

This project integrates with the Orb billing platform and requires:

### Orb TypeScript SDK
The application uses the [orb-billing](https://www.npmjs.com/package/orb-billing) npm package (v4.71.2) for TypeScript/JavaScript integration.

```bash
npm install orb-billing
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd orb-companion-webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory with the following variables:
   
   ```env
   # Orb API Keys for different instances
   # Nimbus Scale Test points to Marshall's Account (test mode)
   ORB_API_KEY_NIMBUS_SCALE_TEST=your_cloud_infra_api_key
   # AI Agent Test points to AI Agent Demo Account (test mode)
   ORB_API_KEY_AI_AGENT_TEST=your_ai_agents_api_key
   
   # Orb Webhook Secret
   ORB_WEBHOOK_SECRET=your_webhook_secret
   
   # Optional: Password Protection
   ENABLE_PASSWORD_PROTECTION=false
   # APP_PASSWORD=your_secure_password
   ```

   **Note:** If you are deploying your application publicly, you may want to establish password protection by setting `ENABLE_PASSWORD_PROTECTION=true` and creating an `APP_PASSWORD` environment variable with your chosen password. If you are using Vercel, learn more about environment variables [here](https://vercel.com/docs/environment-variables).

   **Getting Orb API Keys:**
   - Navigate to your account settings
   - Generate API keys for your instances
   - Set up webhook endpoints and get your webhook secret

## Getting Started

1. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

3. **Select an Instance:**
   The application supports two Orb instances:
   - **Nimbus Scale** - Cloud Infrastructure Platform
   - **Neural Prime** - AI Agent Platform
   
   Choose your instance on the plan selection page.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests with coverage

## Project Architecture

### Multi-Instance Support
This application supports multiple Orb instances with separate configurations:
- **Cloud Infrastructure** (Nimbus Scale) - Uses `ORB_API_KEY_NIMBUS_SCALE_TEST`
- **AI Agents** (Neural Prime) - Uses `ORB_API_KEY_AI_AGENT_TEST`

Each instance has its own branding, features, and API configuration managed in `src/lib/orb-config.ts`.

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **State Management**: Zustand with persistence
- **Server State**: TanStack Query (React Query) for API data caching
- **API Integration**: orb-billing SDK
- **Testing**: Jest with React Testing Library
- **Animation**: Framer Motion

## Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

### Orb Platform
- [Orb Documentation](https://docs.orb.ai/) - learn about Orb's billing platform
- [Orb TypeScript SDK](https://github.com/orbcorp/orb-node) - SDK documentation

## Deployment

### Vercel (Recommended)
The easiest way to deploy this Next.js app is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in Vercel's dashboard
4. Deploy

### Environment Variables for Production
Ensure you set the following environment variables in your deployment platform:
- `ORB_API_KEY_NIMBUS_SCALE_TEST` (or production equivalent)
- `ORB_API_KEY_AI_AGENT_TEST` (or production equivalent) 
- `ORB_WEBHOOK_SECRET`
- `ENABLE_PASSWORD_PROTECTION` (optional)
