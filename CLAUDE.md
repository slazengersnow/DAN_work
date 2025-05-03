# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands
- Start both frontend and backend: `npm start`
- Start frontend only: `npm run start:frontend` or `cd frontend && npm start`
- Start backend only: `npm run start:backend` or `cd backend && npm run dev`
- Build frontend: `cd frontend && npm run build`
- Run tests: `cd frontend && npm test`
- Run specific test: `cd frontend && npm test -- -t "test name pattern"`
- Install dependencies: `npm run install:all`

## Code Style Guidelines
- Use TypeScript for all new components and files
- Use React functional components with hooks, not class components
- Import order: React, external libraries, internal components, types, styles
- Use explicit imports (avoid `import * as xyz`)
- File naming: PascalCase for components (Component.tsx), camelCase for others
- Error handling: Always use try/catch with error logging in API calls
- Types: Define interfaces/types in separate files under `/types` directory
- Comments: Japanese comments are acceptable for domain-specific content
- CSS: Component-specific styles in separate .css files with same name as component
- State management: Use React Query for API data, useState/useContext for local state
- Props: Define prop interfaces with clear naming (e.g., `ComponentNameProps`)