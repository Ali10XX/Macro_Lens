# MacroLens

AI-powered recipe and nutrition management system combining video/audio/text parsing, robust food tracking, and intuitive interfaces.

## Features

- Multimodal Recipe Extraction (Video Processing + Gemini + EasyOCR)
- Nutrition Engine (USDA APIs + ML estimation)
- Full CRUD operations with filtering and ratings
- Mobile & Web applications with shared backend
- JWT Authentication with premium tier support
- Social Media Recipe Import System

## Tech Stack

- **Backend**: FastAPI + PostgreSQL + Redis
- **Frontend**: Next.js (SSR) + TypeScript
- **Mobile**: React Native/Expo
- **AI/ML**: FFmpeg/MoviePy, Google Gemini, EasyOCR
- **Infrastructure**: Docker, GitHub Actions CI/CD

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd MacroLens
```

2. Set up environment variables
```bash
cp config/.env.example config/.env
# Edit config/.env with your values
```

3. Start development environment
```bash
docker-compose up -d
```

4. Install dependencies
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm install

# Mobile
cd mobile && npm install
```

### Development

- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- API Documentation: http://localhost:8000/docs

## Project Structure

```
MacroLens/
├── backend/          # FastAPI backend
├── frontend/         # Next.js web app
├── mobile/           # React Native app
├── shared/           # Shared types & constants
├── tests/            # Test suites
├── deployment/       # Docker & deployment configs
├── config/           # Environment configurations
└── link_recipe_extraction/  # Social media import module
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

[License details here]