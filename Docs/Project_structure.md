# Project Structure - Cursor Rules

## Primary Directive
Maintain a scalable, clean, and modular codebase. All team members must follow these structural standards.

## Root Directory Layout
MacroLens/
├── backend/
│ ├── app/
│ ├── models/
│ ├── routes/
│ └── tasks/
├── frontend/
│ ├── components/
│ ├── pages/
│ ├── utils/
│ └── styles/
├── mobile/
│ ├── screens/
│ ├── components/
│ └── services/
├── shared/
│ ├── constants/
│ └── types/
├── tests/
├── deployment/
├── config/
├── docs/
└── link_recipe_extraction/
    ├── link_detection/
    ├── crawler/
    ├── parser/
    ├── utils/
    └── tests/

markdown
Copy
Edit
## Guidelines
- **Backend (`/backend`)**: Python FastAPI or Flask app
- **Frontend (`/frontend`)**: Next.js app (Vercel-ready)
- **Mobile (`/mobile`)**: Expo-managed React Native app
- **Shared (`/shared`)**: Cross-platform constants, types, helpers
- **Docs**: Contains all project documentation
- **Tests**: All test files grouped by domain

## CI/CD & Environments
- Use GitHub Actions for automated build & deploy
- Dockerfile in `deployment/`
- `.env`, `.env.production`, and `.env.staging` stored in `config/`

## Conventions
- Use `camelCase` for file names, `PascalCase` for components
- Keep each file under 400 lines
- One module/component per file

## Social Media Recipe Import Module

### link_recipe_extraction/
**Purpose**: Automated detection and extraction of recipe data from social media posts and linked recipe websites.

#### Module Structure and Responsibilities

**link_detection/** - Social media post analysis and URL detection
- Analyzes social media post text for recipe-related content and link patterns
- Identifies and extracts URLs from text using pattern matching
- Matches detected patterns against known recipe site domains
- Detects "link in bio" phrases and similar recipe-related indicators

**crawler/** - Web crawling and content retrieval
- Main crawling engine for visiting recipe websites
- Handles dynamic content and JavaScript-rendered pages
- Manages browser instances and session handling
- Implements respectful crawling with rate limiting and delays

**parser/** - Recipe data extraction and processing
- Primary recipe data extraction from HTML content
- Handles structured data (JSON-LD, microdata, schema.org)
- Implements fallback parsing methods for unstructured content
- Normalizes extracted data into consistent format

**utils/** - Supporting utilities and validation
- URL validation and sanitization
- Content cleaning and normalization
- Error handling and logging utilities
- Configuration management for supported domains

**tests/** - Comprehensive testing suite
- Unit tests for each module component
- Integration tests for complete import workflows
- Mock data and test fixtures for recipe sites
- Performance and load testing scenarios

#### Integration Points
- **Backend API**: Exposes endpoints for manual and automatic recipe import
- **Notification System**: Real-time updates on import progress and status
- **Database Layer**: Integrates with existing recipe storage models
- **Queue System**: Asynchronous processing using existing task infrastructure
- **Monitoring**: Logging and metrics collection for system health tracking