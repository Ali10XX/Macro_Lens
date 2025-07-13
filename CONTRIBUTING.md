# Contributing to MacroLens

## Development Setup

1. Clone the repository
2. Copy `config/.env.example` to `config/.env` and fill in your values
3. Start development environment: `docker-compose up -d`
4. Install dependencies for each component

## Project Structure

- `backend/` - FastAPI backend application
- `frontend/` - Next.js web application  
- `mobile/` - React Native/Expo mobile app
- `shared/` - Shared types and constants
- `link_recipe_extraction/` - Social media import module

## Development Guidelines

### Code Style
- Backend: Follow PEP 8, use Black for formatting
- Frontend: Use Prettier with Tailwind CSS
- Mobile: Follow React Native best practices

### Testing
- Write tests for all new features
- Maintain >80% code coverage
- Run tests before submitting PRs

### Git Workflow
1. Create feature branch from `develop`
2. Make changes and add tests
3. Submit PR to `develop` branch
4. Code review and merge

## API Development

All API endpoints should:
- Use proper HTTP status codes
- Include comprehensive error handling
- Have OpenAPI documentation
- Include authentication where required

## Frontend Development

- Use TypeScript for type safety
- Follow component composition patterns
- Implement responsive design
- Ensure accessibility compliance

## Mobile Development

- Test on both iOS and Android
- Use platform-specific patterns where appropriate
- Handle permissions properly
- Optimize for performance