# CLAUDE.md - Guidelines for Lin.q Portal Codebase

## Build & Development Commands
- `npm start` - Run development server
- `npm run build` - Build production bundle
- `npm test` - Run all tests
- `npm test -- --testPathPattern=src/App.test.js` - Run single test file
- `npm test -- --watch` - Run tests in watch mode
- Add `CI=true` prefix to run tests in CI mode

## Code Style Guidelines
- **Imports**: React first, third-party libs next, local components last, CSS at bottom
- **Component Structure**: Functional components with hooks, export default at file end
- **Naming**: PascalCase for components, camelCase for variables/functions
- **State Management**: useState/useEffect hooks with descriptive names
- **Error Handling**: try/catch for API calls, error states for user feedback
- **API Integration**: Use fetch API with consistent error handling pattern
- **UI Patterns**: Form submission with preventDefault(), conditional rendering
- **Security**: Store sensitive data in environment variables, not hardcoded

## Project Structure
- React SPA for URL shortening service with API key registration
- Components organized by feature (ShortenURL.js, RegisterAPIKey.js)
- Single CSS file (App.css) for consistent styling
- AWS serverless backend integration (Lambda, DynamoDB)

Remember to maintain error fallback mechanisms and responsive design patterns.